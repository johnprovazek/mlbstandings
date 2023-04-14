import math
import time
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import date

# Function arguments aren't used. They need to be there when ran as a Google Cloud Function.
def scrape(arg0,arg1):
    league_dict = {
        "year": date.today().year,
        "epochdate": int(time.time()),
        "maxwinloss": "",
        "maxgames": "",
        "divisions": {
            "ALW": {
                "scores":{"SEA":[0],"HOU":[0],"LAA":[0],"OAK":[0],"TEX":[0]},
                "teams":["SEA","HOU","LAA","OAK","TEX"],
                "colors":["#005C5C","#EB6E1F","#BA0021","#EFB21E","#003278"],
                "ranking": [0,1,2,3,4],
                "asterisk": ""
            },
            "ALC": {
                "scores":{"KCR":[0],"CHW":[0],"DET":[0],"MIN":[0],"CLE":[0]},
                "teams":["KCR","CHW","DET","MIN","CLE"],
                "colors":["#BD9B60","#27251F","#FA4616","#002B5C","#E31937"],
                "ranking": [0,1,2,3,4],
                "asterisk": ""
            },
            "ALE": {
                "scores":{"NYY":[0],"TOR":[0],"TBR":[0],"BAL":[0],"BOS":[0]},
                "teams":["NYY","TOR","TBR","BAL","BOS"],
                "colors":["#0C2340","#134A8E","#8FBCE6","#DF4601","#BD3039"],
                "ranking": [0,1,2,3,4],
                "asterisk": ""
            },
            "NLW": {
                "scores":{"SDP":[0],"LAD":[0],"SFG":[0],"COL":[0],"ARI":[0]},
                "teams":["SDP","LAD","SFG","COL","ARI"],
                "colors":["#FFC425","#005A9C","#FD5A1E","#33006F","#A71930"],
                "ranking": [0,1,2,3,4],
                "asterisk": ""
            },
            "NLC": {
                "scores":{"STL":[0],"CHC":[0],"CIN":[0],"MIL":[0],"PIT":[0]},
                "teams":["STL","CHC","CIN","MIL","PIT"],
                "colors":["#C41E3A","#0E3386","#000000","#12284B","#FDB827"],
                "ranking": [0,1,2,3,4],
                "asterisk": ""
            },
            "NLE": {
                "scores":{"NYM":[0],"PHI":[0],"ATL":[0],"MIA":[0],"WSN":[0]},
                "teams":["NYM","PHI","ATL","MIA","WSN"],
                "colors":["#FF5910","#002D72","#EAAA00","#000000","#AB0003"],
                "ranking": [0,1,2,3,4],
                "asterisk": ""
            },
        }
    }

    team_name_dict = {
      "Los Angeles Angels": "LAA",
      "Los Angeles Angels of Anaheim": "LAA",
      "Texas Rangers": "TEX",
      "Houston Astros": "HOU",
      "Oakland Athletics": "OAK",
      "Seattle Mariners": "SEA",
      "Cleveland Guardians": "CLE",
      "Cleveland Indians" : "CLE",
      "Minnesota Twins": "MIN",
      "Chicago White Sox": "CHW",
      "Detroit Tigers": "DET",
      "Kansas City Royals": "KCR",
      "Tampa Bay Rays" : "TBR",
      "New York Yankees" : "NYY",
      "Toronto Blue Jays" : "TOR",
      "Baltimore Orioles" : "BAL",
      "Boston Red Sox": "BOS",
      "Los Angeles Dodgers": "LAD",
      "San Francisco Giants": "SFG",
      "Arizona Diamondbacks": "ARI",
      "Colorado Rockies": "COL",
      "San Diego Padres": "SDP",
      "Milwaukee Brewers" : "MIL",
      "Pittsburgh Pirates" : "PIT",
      "Cincinnati Reds": "CIN",
      "Chicago Cubs": "CHC",
      "St. Louis Cardinals": "STL",
      "Atlanta Braves" : "ATL",
      "Miami Marlins" : "MIA",
      "New York Mets" : "NYM",
      "Philadelphia Phillies" : "PHI",
      "Washington Nationals" : "WSN"
    }

    # Getting the division rankings
    league_identifiers = ["NL", "AL"]
    division_identifiers = ["W", "C", "E"]
    for l_i in league_identifiers:
      league_url = "https://www.baseball-reference.com/leagues/" + l_i + "/" + str(league_dict["year"]) + ".shtml"
      req = requests.get(league_url)
      soup = BeautifulSoup(req.content, 'html.parser')
      for d_i in division_identifiers:
        division_table = soup.find('table', id="standings_" + d_i).select_one("tbody")
        division_rows = division_table.findAll('tr')
        for ranking, row in enumerate(division_rows):
          team_name = row.select_one("th")["csk"]
          team_code = team_name_dict[team_name]
          team_index = league_dict["divisions"][l_i + d_i]["teams"].index(team_code)
          league_dict["divisions"][l_i + d_i]["ranking"][team_index] = ranking

    # Getting the win loss changes
    win_loss_max_tracker = 0
    max_games_tracker = 0
    for division in league_dict["divisions"]:
        time.sleep(15)
        for team in league_dict["divisions"][division]["teams"]:
            url = "https://www.baseball-reference.com/teams/" + team + "/" + str(league_dict["year"]) +"-schedule-scores.shtml"
            req = requests.get(url)
            soup = BeautifulSoup(req.content, 'html.parser')
            schedule_table = soup.find('table', id="team_schedule")
            rows = schedule_table.findAll('tr')
            win_loss_tracker = 0
            game_counter = 0
            for row in rows:
                game_number = row.find(attrs={"data-stat" : "team_game"}).contents[0]
                if(game_number != "Gm#"):
                    win_loss_element = row.find(attrs={"data-stat" : "win_loss_result"})
                    if win_loss_element is not None:
                        win_loss_char = win_loss_element.contents[0][0]
                        if(win_loss_char == "W"):
                            win_loss_tracker = win_loss_tracker + 1
                            if(abs(win_loss_tracker) > win_loss_max_tracker):
                                win_loss_max_tracker = abs(win_loss_tracker)
                            game_counter = game_counter + 1
                        elif(win_loss_char == "L"):
                            win_loss_tracker = win_loss_tracker - 1
                            if(abs(win_loss_tracker) > win_loss_max_tracker):
                                win_loss_max_tracker = abs(win_loss_tracker)
                            game_counter = game_counter + 1
                        else:
                            print("error with W/L scraping with: " + team)
                        league_dict["divisions"][division]["scores"][team].append(win_loss_tracker)
                    else:
                        break
            if game_counter > max_games_tracker:
                max_games_tracker = game_counter

    league_dict["maxwinloss"] = math.ceil((win_loss_max_tracker+1)/10)*10
    league_dict["maxgames"] = math.ceil((max_games_tracker+1)/10)*10

    # Updating Firebase
    cred = credentials.Certificate("firebasekey.json")
    firebase_admin.initialize_app(cred)
    db=firebase_admin.firestore.client()
    db.collection('seasons').document(str(league_dict["year"])).set(league_dict)

scrape("","")