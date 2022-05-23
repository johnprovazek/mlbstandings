import "./App.css";
import React,{useRef,Component} from "react";
import {db} from "./firebase"
import {doc, getDoc} from "firebase/firestore";
import {Chart} from "react-google-charts";

class App extends Component{
  constructor(props) {
    super(props);
    this.state = {
      complete_data: {},
      scaled_line_width: 1,
      layout: null,
      cur_data: [["Games Played", "null", "null", "null", "null", "null"],[0,0,0,0,0,0]],
      data_date_disclaimer: "",
      options: {
        legend: 'none',
        chartArea: {
          backgroundColor: '#EAEAEA',
          top: "2.2222%",
          bottom: "13.333%",
          left: "6%",
          right: "6%"
        },
        hAxis: {
          textPosition: 'none',
          baselineColor: 'white',
          viewWindowMode: 'explicit',
          viewWindow: {
            min: 0,
            max: 100,
          },
          gridlines: {
            count: 0,
            multiple: 10
          }
        },
        vAxis: {
          textPosition: 'none',
          viewWindowMode: 'explicit',
          viewWindow: {
            min: -20,
            max: -20
          },
          gridlines: {
            multiple: 10
          },
          minorGridlines: {
            count: 0
          }
        } 
      },
      season: '2022',
      division: 'NLC',
      seasons_list: [
        { label: '2022', value: '2022' },
        { label: '2021', value: '2021' },
        { label: '2020', value: '2020' },
        { label: '2019', value: '2019' },
        { label: '2018', value: '2018' },
        { label: '2017', value: '2017' },
      ],
      divisions_list: [
        { label: 'ALW', value: 'ALW' },
        { label: 'ALC', value: 'ALC' },
        { label: 'ALE', value: 'ALE' },
        { label: 'NLW', value: 'NLW' },
        { label: 'NLC', value: 'NLC' },
        { label: 'NLE', value: 'NLE' },
      ],
      title_label_list: {
        'ALW': 'AL West',
        'ALC': 'AL Central' ,
        'ALE': 'AL East' ,
        'NLW': 'NL West' ,
        'NLC': 'NL Central' ,
        'NLE': 'NL East' ,
      },
      colors_dict: {
        'SEA': '#005C5C',
        'HOU': '#EB6E1F',
        'LAA': '#862633',
        'OAK': '#EFB21E',
        'TEX': '#003278',
        'KCR': '#BD9B60',
        'CHW': '#27251F',
        'DET': '#FA4616',
        'MIN': '#002B5C',
        'CLE': '#E31937',
        'NYY': '#0C2340',
        'TOR': '#134A8E',
        'TBR': '#8FBCE6',
        'BAL': '#DF4601',
        'BOS': '#BD3039',
        'SDP': '#FFC425',
        'LAD': '#005A9C',
        'SFG': '#FD5A1E',
        'COL': '#33006F',
        'ARI': '#A71930',
        'STL': '#C41E3A',
        'CHC': '#0E3386',
        'CIN': '#000000',
        'MIL': '#12284B',
        'PIT': '#FDB827',
        'NYM': '#FF5910',
        'PHI': '#002D72',
        'ATL': '#EAAA00',
        'MIA': '#000000',
        'WSN': '#AB0003',
      },
    };
  }

  chartEvents = [
    {
      eventName: "ready",
      callback({ chartWrapper, google}) {
        if (chartWrapper["Bea"]["bf"][1]["label"] != "null"){
          var team_counter = 0;
          var game_num_array = ["Header","null","null","null","null","null"]
          var win_loss_num_array = ["Header","null","null","null","null","null"]
          var team_name_array = ["Header","null","null","null","null","null"]
          for(var i= 1; i < 6; i++){
            team_name_array[i] = chartWrapper["Bea"]["bf"][i]["label"]
          }
          chartendloop:
          for(var i = chartWrapper["Bea"]["Wf"].length-1; i > -1; i--){
            for(var j = 1; j < 6; j++){
              if(game_num_array[j] == "null" && (typeof chartWrapper["Bea"]["Wf"][i]["c"][j]["v"] !== "undefined")){
                game_num_array[j] = chartWrapper["Bea"]["Wf"][i]["c"][j]["v"]
                win_loss_num_array[j] = i
                team_counter++
                if(team_counter == 5){
                  break chartendloop; 
                }
              }
            }
          }
          console.log("---------------------------")
          for(var i= 1; i < 6; i++){
            var layout = chartWrapper.getChart().getChartLayoutInterface();
            var yPos = layout.getYLocation(game_num_array[i]);
            var xPos = layout.getXLocation(win_loss_num_array[i]);
            var teamLogo = document.getElementById("teamLogo" + String(i-1));
            teamLogo.style.display = "block";
            var squareWidth = teamLogo.clientWidth
            console.log(xPos + ", " + yPos + ", " + squareWidth)
            // console.log(squareWidth)
            teamLogo.src = "./logos/" + team_name_array[i] +".svg";
            // teamLogo.src = "../logos/red.png";
            // teamLogo.style.width = "1px";
            // teamLogo.style.height = "1px";
            // teamLogo.style.top = (yPos) + 'px';
            // teamLogo.style.left = (xPos) + 'px';
            teamLogo.style.top = (yPos - squareWidth/2) + 'px';
            teamLogo.style.left = (xPos) + 'px';
          }
        }
      }
    }
  ];

  componentDidMount() {
    this.fetchSeasonData();
    window.addEventListener('resize', () => {
      this.fetchSeasonData();
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => {
      this.fetchSeasonData();
    })
  }

  handleSeasonChange(input){
    this.setState({
      season: input
    }, () => {
      this.fetchSeasonData();
    });
  }

  handleDivisionChange(input){
    this.setState({
      division: input
    }, () => {
      this.fetchSeasonData();
    });
  }

  fetchSeasonData(){
    const firebaseRequest = async () => {
      if(this.state.season in this.state.complete_data === false){
        // firebase request
        const docRef = doc(db, "seasons", this.state.season)
        const response = await getDoc(docRef)
        var seasonData = response.data()

        // convert the date to local time
        // TODO: this only needs to be ran once
        var date_2022 = this.state.data_date_disclaimer
        if(this.state.season == '2022'){
          var date = new Date(0)
          date.setUTCSeconds(seasonData["epochdate"])
          var options = { year: 'numeric', month: 'long', day: 'numeric' , hour: 'numeric', minute: 'numeric', timeZoneName: 'short'}
          date_2022 = " on " + date.toLocaleDateString("en-US", options)
        }
        this.setState({
          complete_data: {
                ...this.state.complete_data,
                [seasonData.year]: seasonData
          },
          data_date_disclaimer: date_2022
        }, () => {
          this.updateGraph();
        });
      }
      else{
        this.updateGraph();
      }
    }
    firebaseRequest()
  };

  updateGraph(){
    var dict = this.state.complete_data[this.state.season]["divisions"][this.state.division]
    var max_games = this.state.complete_data[this.state.season]["maxgames"] // TODO: Some reason there is no out of bounds error

    var lineScaleMultiplier = 1
    if(window.innerWidth < 1281){
      var element = document.getElementById("chartContainer")
      var computedStyle = getComputedStyle(element);
      var chartWidth = (element.clientWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight));
      lineScaleMultiplier = 0.0020833333333333333 * (chartWidth) - 0.6
    }    
    var scaledLineWidth = (0.000141026 * Math.pow(max_games, 2) - 0.0488462*(max_games) + 6.728210) * lineScaleMultiplier
    
    var new_data = []
    new_data.push(["Games Played", dict["teams"][0], dict["teams"][1], dict["teams"][2], dict["teams"][3], dict["teams"][4]]);
    for (let i = 0; i < max_games; i++) {
      var team0 = dict["scores"][dict["teams"][0]][i]
      var team1 = dict["scores"][dict["teams"][1]][i]
      var team2 = dict["scores"][dict["teams"][2]][i]
      var team3 = dict["scores"][dict["teams"][3]][i]
      var team4 = dict["scores"][dict["teams"][4]][i]
      new_data.push([i,team0,team1,team2,team3,team4])
    }
    
    document.body.style.backgroundColor = this.state.colors_dict[dict["leader"]]
    
    this.setState({
      cur_data: new_data,
      options: {
        legend: 'none',
        lineWidth: scaledLineWidth,
        colors: [dict["colors"][0], dict["colors"][1], dict["colors"][2], dict["colors"][3], dict["colors"][4]],
        chartArea: {
          backgroundColor: '#EAEAEA',
          top: "2.2222%",
          bottom: "13.333%",
          left: "6%",
          right: "6%"
        },
        hAxis: {
          title: 'GAMES PLAYED',
          titleTextStyle: {
            italic: false,
          },
          baselineColor: 'white',
          viewWindowMode: 'explicit',
          viewWindow: {
            max: this.state.complete_data[this.state.season]["maxgames"]
          },
          gridlines: {
            count: 0,
            multiple: 10
          }
        },
        vAxis: {
          title: 'WINS - LOSSES',
          titleTextStyle: {
            italic: false,
          },
          viewWindowMode: 'explicit',
          viewWindow: {
            max: this.state.complete_data[this.state.season]["maxwinloss"],
            min: this.state.complete_data[this.state.season]["maxwinloss"] * -1
          },
          gridlines: {
            multiple: 10
          },
          minorGridlines: {
            count: 0
          }
        } 
      }
    });
  }

  render() {
    return (
      <div className="App">
        <h1 id="maintitle">MLB Standings&nbsp;
          <a href="https://github.com/johnprovazek/mlbstandings">
            <i className="fa fa-github" aria-hidden="true"></i>
          </a>
        </h1>
        <div id="dropdownContainer">
          <div id="standingsContainer">
            <h2 className="dropdownTitle">Season:</h2>
            <select className="minimal" value={this.state.season} onChange={(e) => this.handleSeasonChange(e.target.value)}>
              {this.state.seasons_list.map((seasons_list_item) => (
                <option key={seasons_list_item.value} value={seasons_list_item.value}>{seasons_list_item.label}</option>
              ))}
            </select>
          </div>
          <div id="divisionContainer">
            <h2 className="dropdownTitle">Division:</h2>  
            <select className="minimal" value={this.state.division} onChange={(e) => this.handleDivisionChange(e.target.value)}>
              {this.state.divisions_list.map((divisions_list_item) => (
                <option key={divisions_list_item.value} value={divisions_list_item.value}>{divisions_list_item.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div id="chartContainer">
          <h2 id="chartTitle">{this.state.season} {this.state.title_label_list[this.state.division]} Standings</h2>
          <div id="googleChartContainer">
            <Chart
              chartType="LineChart"
              width="100%"
              height="100%"
              data={this.state.cur_data}
              options={this.state.options}
              chartEvents={this.chartEvents}
            />
            <img id="teamLogo0" className="teamLogo"></img>
            <img id="teamLogo1" className="teamLogo"></img>
            <img id="teamLogo2" className="teamLogo"></img>
            <img id="teamLogo3" className="teamLogo"></img>
            <img id="teamLogo4" className="teamLogo"></img>
          </div>
        </div>
        <h4 id="dataDisclaimer">Data was last sourced from <a href="https://www.baseball-reference.com/">baseball-reference.com</a>{this.state.data_date_disclaimer}</h4>
      </div>
    );
  }
}

export default App;