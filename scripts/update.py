"""scrape.py pulls MLB standings data from baseball-reference.com and adds it to a Firebase Firestore database. """

# Bot reference page: https://www.sports-reference.com/bot-traffic.html

# pylint: disable=E0401

from datetime import date
import math
import time
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import requests


# Function arguments aren't used. They need to be there when ran as a Google Cloud Function.
def scrape(arg0, arg1):
    """Pulls MLB standings data from baseball-reference.com and adds it to a Firebase Firestore database."""
    league_dict = {
        "year": date.today().year,
        "epochdate": int(time.time()),
        "maxwinloss": "",
        "maxgames": "",
        "divisions": {
            "ALW": {
                "teams": {
                    "SEA": {"scores": [0], "rank": 0, "color": "#005C5C"},
                    "HOU": {"scores": [0], "rank": 0, "color": "#EB6E1F"},
                    "LAA": {"scores": [0], "rank": 0, "color": "#BA0021"},
                    "OAK": {"scores": [0], "rank": 0, "color": "#EFB21E"},
                    "TEX": {"scores": [0], "rank": 0, "color": "#003278"},
                },
                "asterisk": "",
            },
            "ALC": {
                "teams": {
                    "KCR": {"scores": [0], "rank": 0, "color": "#BD9B60"},
                    "CHW": {"scores": [0], "rank": 0, "color": "#27251F"},
                    "DET": {"scores": [0], "rank": 0, "color": "#FA4616"},
                    "MIN": {"scores": [0], "rank": 0, "color": "#002B5C"},
                    "CLE": {"scores": [0], "rank": 0, "color": "#E31937"},
                },
                "asterisk": "",
            },
            "ALE": {
                "teams": {
                    "NYY": {"scores": [0], "rank": 0, "color": "#0C2340"},
                    "TOR": {"scores": [0], "rank": 0, "color": "#134A8E"},
                    "TBR": {"scores": [0], "rank": 0, "color": "#8FBCE6"},
                    "BAL": {"scores": [0], "rank": 0, "color": "#DF4601"},
                    "BOS": {"scores": [0], "rank": 0, "color": "#BD3039"},
                },
                "asterisk": "",
            },
            "NLW": {
                "teams": {
                    "SDP": {"scores": [0], "rank": 0, "color": "#FFC425"},
                    "LAD": {"scores": [0], "rank": 0, "color": "#005A9C"},
                    "SFG": {"scores": [0], "rank": 0, "color": "#FD5A1E"},
                    "COL": {"scores": [0], "rank": 0, "color": "#33006F"},
                    "ARI": {"scores": [0], "rank": 0, "color": "#A71930"},
                },
                "asterisk": "",
            },
            "NLC": {
                "teams": {
                    "STL": {"scores": [0], "rank": 0, "color": "#C41E3A"},
                    "CHC": {"scores": [0], "rank": 0, "color": "#0E3386"},
                    "CIN": {"scores": [0], "rank": 0, "color": "#000000"},
                    "MIL": {"scores": [0], "rank": 0, "color": "#12284B"},
                    "PIT": {"scores": [0], "rank": 0, "color": "#FDB827"},
                },
                "asterisk": "",
            },
            "NLE": {
                "teams": {
                    "NYM": {"scores": [0], "rank": 0, "color": "#FF5910"},
                    "PHI": {"scores": [0], "rank": 0, "color": "#002D72"},
                    "ATL": {"scores": [0], "rank": 0, "color": "#EAAA00"},
                    "MIA": {"scores": [0], "rank": 0, "color": "#00A3E0"},
                    "WSN": {"scores": [0], "rank": 0, "color": "#AB0003"},
                },
                "asterisk": "",
            },
        },
    }

    team_name_dict = {
        "Los Angeles Angels": "LAA",
        "Los Angeles Angels of Anaheim": "LAA",
        "Texas Rangers": "TEX",
        "Houston Astros": "HOU",
        "Oakland Athletics": "OAK",
        "Seattle Mariners": "SEA",
        "Cleveland Guardians": "CLE",
        "Cleveland Indians": "CLE",
        "Minnesota Twins": "MIN",
        "Chicago White Sox": "CHW",
        "Detroit Tigers": "DET",
        "Kansas City Royals": "KCR",
        "Tampa Bay Rays": "TBR",
        "New York Yankees": "NYY",
        "Toronto Blue Jays": "TOR",
        "Baltimore Orioles": "BAL",
        "Boston Red Sox": "BOS",
        "Los Angeles Dodgers": "LAD",
        "San Francisco Giants": "SFG",
        "Arizona Diamondbacks": "ARI",
        "Colorado Rockies": "COL",
        "San Diego Padres": "SDP",
        "Milwaukee Brewers": "MIL",
        "Pittsburgh Pirates": "PIT",
        "Cincinnati Reds": "CIN",
        "Chicago Cubs": "CHC",
        "St. Louis Cardinals": "STL",
        "Atlanta Braves": "ATL",
        "Miami Marlins": "MIA",
        "New York Mets": "NYM",
        "Philadelphia Phillies": "PHI",
        "Washington Nationals": "WSN",
    }

    # Getting the division rankings.
    league_identifiers = ["NL", "AL"]
    division_identifiers = ["W", "C", "E"]
    for l_i in league_identifiers:
        league_url = "https://www.baseball-reference.com/leagues/" + l_i + "/" + str(league_dict["year"]) + ".shtml"
        req = requests.get(league_url, timeout=10)
        soup = BeautifulSoup(req.content, "html.parser")
        for d_i in division_identifiers:
            division_table = soup.find("table", id="standings_" + d_i).select_one("tbody")
            division_rows = division_table.findAll("tr")
            for ranking, row in enumerate(division_rows):
                team_name = row.select_one("th")["csk"]
                team_code = team_name_dict[team_name]
                league_dict["divisions"][l_i + d_i]["teams"][team_code]["rank"] = ranking

    # Getting the win/loss changes.
    max_win_loss_tracker = 0
    max_games_tracker = 0
    for division_code in league_dict["divisions"]:
        for team_code in league_dict["divisions"][division_code]["teams"]:
            time.sleep(4)  # Limits requests to not be flagged as a bot.
            url = (
                "https://www.baseball-reference.com/teams/"
                + team_code
                + "/"
                + str(league_dict["year"])
                + "-schedule-scores.shtml"
            )
            req = requests.get(url, timeout=10)
            soup = BeautifulSoup(req.content, "html.parser")
            schedule_table = soup.find("table", id="team_schedule")
            rows = schedule_table.findAll("tr")
            win_loss_tracker = 0
            game_counter = 0
            for row in rows:
                game_number = row.find(attrs={"data-stat": "team_game"}).contents[0]
                if game_number != "Gm#":
                    win_loss_element = row.find(attrs={"data-stat": "win_loss_result"})
                    if win_loss_element is not None:
                        win_loss_char = win_loss_element.contents[0][0]
                        if win_loss_char == "W":
                            win_loss_tracker = win_loss_tracker + 1
                            if abs(win_loss_tracker) > max_win_loss_tracker:
                                max_win_loss_tracker = abs(win_loss_tracker)
                            game_counter = game_counter + 1
                        elif win_loss_char == "L":
                            win_loss_tracker = win_loss_tracker - 1
                            if abs(win_loss_tracker) > max_win_loss_tracker:
                                max_win_loss_tracker = abs(win_loss_tracker)
                            game_counter = game_counter + 1
                        else:
                            print("error with W/L scraping with: " + team_code)
                        league_dict["divisions"][division_code]["teams"][team_code]["scores"].append(win_loss_tracker)
                    else:
                        break
            if game_counter > max_games_tracker:
                max_games_tracker = game_counter

    # Setting the chart max x and y values.
    if max_games_tracker >= 162:  # Completed regular season.
        league_dict["maxwinloss"] = 80
        league_dict["maxgames"] = 180
    elif league_dict["year"] == 2020:  # Short COVID season.
        league_dict["maxwinloss"] = 30
        league_dict["maxgames"] = 70
    elif league_dict["year"] == date.today().year:  # Current season still in progress.
        league_dict["maxwinloss"] = math.ceil(max_win_loss_tracker / 8) * 10
        league_dict["maxgames"] = math.ceil(max_games_tracker / 9) * 10

    # Setting asterisk values.
    if league_dict["year"] == 2020:
        for division_code in league_dict["divisions"]:
            league_dict["divisions"][division_code]["asterisk"] = "* Shortened season due to the COVID-19 pandemic"
    elif league_dict["year"] == 2016:
        league_dict["divisions"]["NLC"]["asterisk"] = "* Cubs vs. Pirates game played on 9/29/2016 scored a Tie"
    elif league_dict["year"] == 2013:
        league_dict["divisions"]["ALE"]["asterisk"] = "* Rays and Rangers played 163rd regular season game on 9/30/2013"
        league_dict["divisions"]["ALW"]["asterisk"] = "* Rays and Rangers played 163rd regular season game on 9/30/2013"
    elif league_dict["year"] == 2018:
        league_dict["divisions"]["NLC"]["asterisk"] = "* Cubs and Brewers played 163rd regular season game on 10/1/2018"
        league_dict["divisions"]["NLW"][
            "asterisk"
        ] = "* Dodgers and Rockies played 163rd regular season game on 10/1/2018"

    # Updating Firebase.
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    db.collection("seasons").document(str(league_dict["year"])).set(league_dict)


scrape("", "")
