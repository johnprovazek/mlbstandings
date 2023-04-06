import math
import time
import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import date

def scrape():
    league_dict = {
        "year": date.today().year,
        "epochdate": None,
        "maxwinloss": "",
        "maxgames": "",
        "divisions": {
            "ALW": {
                "scores":{"SEA":[0],"HOU":[0],"LAA":[0],"OAK":[0],"TEX":[0]},
                "teams":["SEA","HOU","LAA","OAK","TEX"],
                "colors":["#005C5C","#EB6E1F","#BA0021","#EFB21E","#003278"],
                "leader": "",
            },
            "ALC": {
                "scores":{"KCR":[0],"CHW":[0],"DET":[0],"MIN":[0],"CLE":[0]},
                "teams":["KCR","CHW","DET","MIN","CLE"],
                "colors":["#BD9B60","#27251F","#FA4616","#002B5C","#E31937"],
                "leader": "",
            },
            "ALE": {
                "scores":{"NYY":[0],"TOR":[0],"TBR":[0],"BAL":[0],"BOS":[0]},
                "teams":["NYY","TOR","TBR","BAL","BOS"],
                "colors":["#0C2340","#134A8E","#8FBCE6","#DF4601","#BD3039"],
                "leader": "",
            },
            "NLW": {
                "scores":{"SDP":[0],"LAD":[0],"SFG":[0],"COL":[0],"ARI":[0]},
                "teams":["SDP","LAD","SFG","COL","ARI"],
                "colors":["#FFC425","#005A9C","#FD5A1E","#33006F","#A71930"],
                "leader": "",
            },
            "NLC": {
                "scores":{"STL":[0],"CHC":[0],"CIN":[0],"MIL":[0],"PIT":[0]},
                "teams":["STL","CHC","CIN","MIL","PIT"],
                "colors":["#C41E3A","#0E3386","#000000","#12284B","#FDB827"],
                "leader": "",
            },
            "NLE": {
                "scores":{"NYM":[0],"PHI":[0],"ATL":[0],"MIA":[0],"WSN":[0]},
                "teams":["NYM","PHI","ATL","MIA","WSN"],
                "colors":["#FF5910","#002D72","#EAAA00","#000000","#AB0003"],
                "leader": "",
            },
        }
    }

    league_dict["epochdate"] = int(time.time())
    win_loss_max_tracker = 0
    max_games_tracker = 0

    for division in league_dict["divisions"]:
        for team in league_dict["divisions"][division]["teams"]:
            url = "https://www.baseball-reference.com/teams/" + team + "/" + str(league_dict["year"]) +"-schedule-scores.shtml"
            req = requests.get(url)
            soup = BeautifulSoup(req.content, 'html.parser')

            # Getting standings position
            meta_div = soup.find('div', id="meta")
            child_div = meta_div.findAll('div')[1]
            paragraph = child_div.findAll('p')[0]
            if(league_dict["year"] == date.today().year):
                standings_position = paragraph.contents[2].replace("\n", "").split(',')[1].strip()[0]
            else:
                standings_position = paragraph.contents[2].replace("\n", "").split(',')[1].strip()[12:13]
            if ( standings_position == "1"):
                league_dict["divisions"][division]["leader"] = team

            # Getting the win loss changes
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
                            print("error with W/L scraping")
                        league_dict["divisions"][division]["scores"][team].append(win_loss_tracker)
                    else:
                        break
            if game_counter > max_games_tracker:
                max_games_tracker = game_counter

    league_dict["maxwinloss"] = math.ceil((win_loss_max_tracker+1)/10)*10
    league_dict["maxgames"] = math.ceil((max_games_tracker+1)/10)*10

    cred = credentials.Certificate("firebasekey.json")
    firebase_admin.initialize_app(cred)
    db=firebase_admin.firestore.client()
    db.collection('seasons').document(str(league_dict["year"])).set(league_dict)