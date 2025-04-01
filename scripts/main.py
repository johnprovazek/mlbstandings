"""main.py pulls and formats MLB standings data from statsapi.mlb.com adding it to a Firebase Firestore database. """

import json
import time
import math
import sys
from datetime import datetime, date
import logging
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# pylint: disable=W0613
# pylint: disable=E1126
# pylint: disable=R0914
# pylint: disable=R0912

CONFIG_FILE = "config.json"
SERVICE_ACCOUNT_KEY = "service-account-key.json"
API_TIMEOUT = 10
API_BASE_URL = "https://statsapi.mlb.com/api/v1/"
GAME_STATUS_FINISHED = "F"
GAME_TYPE_REGULAR_SEASON = "R"
SPORT_ID_MLB = "1"
DATE_FORMAT = "%Y-%m-%dT%H:%M:%SZ"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_config():
    """Loads and returns the configuration data."""
    try:
        with open(CONFIG_FILE, 'r', encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        logging.error("Config file %s not found.", CONFIG_FILE)
        sys.exit(1)
    except json.JSONDecodeError:
        logging.error("Error decoding JSON in %s.", CONFIG_FILE)
        sys.exit(1)

def get_record_by_type(split_records_list: list, record_type: str):
    """Gets record by type."""
    for split_record in split_records_list:
        if split_record.get("type") == record_type:
            return f"{split_record["wins"]}-{split_record["losses"]}"
    return ""

def get_result_addend(team_data: dict):
    """Determines the addend for the result of a game (Win, Loss, or Tie)."""
    if team_data.get("isWinner") is True:
        return 1
    if team_data.get("isWinner") is False:
        return -1
    return 0

def filtered_game_data(game: dict):
    """Filters game data to only relevant data"""
    game_data = {}
    for location in ["home", "away"]:
        game_data[location] = {
            "team_id": str(game["teams"][location]["team"]["id"]),
            "resultAddend": get_result_addend(game["teams"][location])
        }
    return game_data

def fetch_standings_data(league_id: int, season_year: int) -> dict:
    """Fetches standings data from the MLB API."""
    url = f"{API_BASE_URL}standings/?leagueId={league_id}&season={season_year}"
    try:
        response = requests.get(url, timeout=API_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as error:
        logging.error("Error fetching standings data: %s", error)
        sys.exit(1)

def fetch_games_data(season_year: int) -> dict:
    """Fetches games data from the MLB API."""
    url = f"{API_BASE_URL}schedule/?sportId={SPORT_ID_MLB}&gameTypes={GAME_TYPE_REGULAR_SEASON}&season={season_year}"
    try:
        response = requests.get(url, timeout=API_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as error:
        logging.error("Error fetching games data: %s", error)
        sys.exit(1)

def get_streak_code(team):
    """Retrieves the streak code from a team's data, or returns '-' if not available."""
    if "streak" in team and "streakCode" in team["streak"]:
        return team["streak"]["streakCode"]
    return "-"

def get_game_date(game):
    """Gets and formats the game date."""
    return datetime.strptime(game["gameDate"], DATE_FORMAT)

def update(arg0, arg1):
    """Updates Firebase with MLB standings data."""
    config = load_config()
    season_year = 2025
    firebase_season_data = {
        "year": season_year,
        "epochDate": int(time.time()),
        "maxWinLoss": 0,
        "maxGames": 0,
        "divisions": {
            "ALW": [],
            "ALC": [],
            "ALE": [],
            "NLW": [],
            "NLC": [],
            "NLE": []
        }
    }
    # Getting standings data.
    team_rankings = {}
    for league_id in config["leagueIds"]:
        standings_data = fetch_standings_data(league_id, firebase_season_data["year"])
        for record in standings_data["records"]:
            division = config["divisionMap"][str(record["division"]["id"])]
            standings = []
            for rank, team in enumerate(record["teamRecords"]):
                team_id = str(team["team"]["id"])
                team_rankings[team_id] = rank
                standings.append({
                    "code": config["teamMap"][team_id]["code"],
                    "color": config["teamMap"][team_id]["color"],
                    "scores": [0],
                    "table": {
                        "rank": str(rank + 1),
                        "name": team["team"]["name"],
                        "wins": str(team["wins"]),
                        "losses": str(team["losses"]),
                        "winPercentage": team["winningPercentage"],
                        "gamesBack": team["divisionGamesBack"],
                        "streak": get_streak_code(team),
                        "homeRecord": get_record_by_type(team["records"]["splitRecords"], "home"),
                        "roadRecord": get_record_by_type(team["records"]["splitRecords"], "away"),
                        "lastTenRecord": get_record_by_type(team["records"]["splitRecords"], "lastTen"),
                    }
                })
            firebase_season_data["divisions"][division] = {
                "asterisk": "",
                "standings": standings
            }
    # Getting game win/loss data
    completed_games = []
    completed_game_ids = set()
    max_games_counter = 0
    max_win_loss_counter = 0
    games_data = fetch_games_data(season_year)
    # Parsing in reverse order to keep the most recent game in circumstance where games have duplicate game ids.
    for game_date in  reversed(games_data["dates"]):
        # Sorting games by time to align double headers correctly.
        sorted_games = sorted(game_date["games"], key=get_game_date, reverse=True)
        for game in sorted_games:
            game_id = game["gamePk"]
            if game["status"]["codedGameState"] == GAME_STATUS_FINISHED and game_id not in completed_game_ids:
                completed_games.append(filtered_game_data(game))
                completed_game_ids.add(game_id)
    # Getting team scores list.
    for complete_game in reversed(completed_games):
        for location in ["home", "away"]:
            team_id = complete_game[location]["team_id"]
            team_division = config["teamMap"][team_id]["division"]
            team_rank = team_rankings[team_id]
            scores = firebase_season_data["divisions"][team_division]["standings"][team_rank]["scores"]
            score_tracker = scores[-1] + complete_game[location]["resultAddend"]
            scores.append(score_tracker)
            scores_counter = len(scores) - 1
            max_games_counter = max(scores_counter, max_games_counter)
            max_win_loss_counter = max(abs(score_tracker), max_win_loss_counter)
    # Setting the chart max x and y values.
    if max_games_counter >= 162: # Completed regular season.
        firebase_season_data["maxWinLoss"] = 90
        firebase_season_data["maxGames"] = 180
    elif firebase_season_data["year"] == 2020: # Short COVID season.
        firebase_season_data["maxWinLoss"] = 30
        firebase_season_data["maxGames"] = 70
    elif firebase_season_data["year"] == date.today().year: # Current season still in progress.
        firebase_season_data["maxWinLoss"] = math.ceil(max_win_loss_counter / 8) * 10
        firebase_season_data["maxGames"] = math.ceil(max_games_counter / 9) * 10
    # Setting asterisk values.
    for division_key, firebase_division in firebase_season_data["divisions"].items():
        year = str(firebase_season_data["year"])
        if year in config["asterisk"] and division_key in config["asterisk"][year]:
            firebase_division["asterisk"] = "* " + config["asterisk"][year][division_key]
    # Updating Firebase.
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    db.collection("seasons").document(str(firebase_season_data["year"])).set(firebase_season_data)

# Remove when ran as Google Cloud Function.
update("", "")
