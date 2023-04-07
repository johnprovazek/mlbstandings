import "./App.css";
import {React,Component} from "react";
import {db} from "./firebase"
import {doc, getDoc} from "firebase/firestore";
import {Chart} from "react-google-charts";

// import blue from './testimages/blue.png';
// import green from './testimages/green.png';
// import orange from './testimages/orange.png';
// import red from './testimages/red.png';
// import yellow from './testimages/yellow.png';

var current_year = new Date().getFullYear()
var divisions_list = ['ALW','ALC','ALE','NLW','NLC','NLE']
var seasons_list = []
for (let year = current_year; year >= 2013; year--) {
  seasons_list.push(String(year))
}

class App extends Component{
  constructor(props) {
    super(props);
    this.state = {
      chartWrapper:null,
      complete_data: {},
      logos_x_y: [],
      scaled_line_width: 1,
      layout: null,
      cur_data: [["Games Played", "null", "null", "null", "null", "null"]],
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
      season: String(current_year),
      division: 'NLC',
      title_label_list: {
        'ALW': 'AL West',
        'ALC': 'AL Central' ,
        'ALE': 'AL East' ,
        'NLW': 'NL West' ,
        'NLC': 'NL Central' ,
        'NLE': 'NL East' ,
      },
    };
  }

  // TODO: bad hack to be able to draw on chart
  // can't figure out how to access state but can access the dom?
  // limited documentation for react-google-charts
  chartEvents = [{
    eventName: "ready",
    callback({ chartWrapper, google}) {
      let layout = chartWrapper.getChart().getChartLayoutInterface();
      let logo_coordinates = document.getElementById("logoCoordinates");
      let logo_coordinates_json = JSON.parse(logo_coordinates.value);
      // console.log(logo_coordinates_json)
      for (let i = 0; i < 5; i++) {
        let yPos = layout.getYLocation(logo_coordinates_json["coordinates"][i]["x"]);
        let xPos = layout.getXLocation(logo_coordinates_json["coordinates"][i]["y"]);
        // console.log(yPos)
        // console.log(xPos)
        var teamLogo = document.getElementById("teamLogo" + i);
        teamLogo.style.display = "block";
        var squareWidth = teamLogo.clientWidth
        // console.log(squareWidth)
        teamLogo.src = "./logos/" + logo_coordinates_json["team_names"][i] +".svg";
        teamLogo.style.top = (yPos - squareWidth/2) + 'px';
        teamLogo.style.left = (xPos) + 'px';
      }
    }
  }];

  // TODO: implement chart download option later
  setChartDownloadhref() {
    if (this.state.chartWrapper === null) { 
      console.error("ChartWrapper not ready yet"); 
    }
    let download_href = document.getElementById("download_href");
    download_href.href = this.state.chartWrapper.getChart().getImageURI();
  }

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
        var date_text = this.state.data_date_disclaimer
        if(this.state.season === current_year.toString()){
          var date = new Date(0)
          date.setUTCSeconds(seasonData["epochdate"])
          let date_style = { year: 'numeric', month: 'long', day: 'numeric' , hour: 'numeric', minute: 'numeric', timeZoneName: 'short'}
          date_text = " on " + date.toLocaleDateString("en-US", date_style)
        }
        this.setState({
          complete_data: {
            ...this.state.complete_data,
            [seasonData.year]: seasonData
          },
          data_date_disclaimer: date_text
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

  logoDataUpdater(teamIndex,x,y){
    let logo_coordinates = document.getElementById("logoCoordinates");
    let logo_coordinates_json = JSON.parse(logo_coordinates.value);
    console.log(logo_coordinates_json)
    logo_coordinates_json["coordinates"][teamIndex] = {"x":x,"y":y}
    logo_coordinates_json["team_names"] = this.state.complete_data[this.state.season]["divisions"][this.state.division]["teams"]
    let logo_cordinates_string = JSON.stringify(logo_coordinates_json)
    logo_coordinates.value = logo_cordinates_string
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
    
    var most_games = 0
    for (let i = 0; i < 5; i++) {
      if(dict["scores"][dict["teams"][i]].length > most_games){
        most_games = dict["scores"][dict["teams"][i]].length
      }
    }
    var new_data = []
    new_data.push(["Games Played", dict["teams"][0], dict["teams"][1], dict["teams"][2], dict["teams"][3], dict["teams"][4]],[0,0,0,0,0,0]); // Added these zeros as a hack to avoid dots
    for (let i = 0; i < max_games; i++) {
      if(i < most_games){
        // Adding Game Data
        let t_s = []
        for (let j = 0; j < 5; j++) {
          let cur_game_unit = dict["scores"][dict["teams"][j]][i]
          let next_game_unit = dict["scores"][dict["teams"][j]][i+1]
          if(typeof cur_game_unit === "number" && typeof next_game_unit === "undefined"){ // next is undefined, meaning this is the last win/loss score
            this.logoDataUpdater(j,cur_game_unit,i)
          }
          t_s.push(cur_game_unit)
        }
        new_data.push([i,t_s[0],t_s[1],t_s[2],t_s[3],t_s[4]])

        // Google Charts hacky approach to get dashed lines
        if(max_games < 70){ // Using 70 here because that is the max_games for shortened 2020 season. Gets hard to see dashed lines at this point too
          new_data.push([i,t_s[0],t_s[1],t_s[2],t_s[3],t_s[4]]) // Adding the same data twice as a hacky approach to avoid dots in the chart
          let from_to = [] // 2D array of the win/loss records between two games for all five teams in a division
          let direction = [0,0,0,0,0] // -1 or 1 directs the slope. 0 means a null should be added to the data.
          let matches = [] // 2D array of the matching groups with same slope between games.
          for (let j = 0; j < 5; j++) {
            let from = dict["scores"][dict["teams"][j]][i]
            let to = dict["scores"][dict["teams"][j]][i+1]
            if(typeof to !== "undefined"){ // Looking at the next team win/loss score, could be undefined
              direction[j] = (from > to) ? -1 : 1;
              // TODO: poor way to handle this, improve later.
              // Bundles matching pairs in a 2d array.
              let new_pair = 1
              for (let k = 0; k < from_to.length && new_pair; k++) {
                if(from_to[k].toString() === [from,to].toString()){
                  for (let a = 0; a < matches.length && new_pair; a++) {
                    for (let b = 0; b < matches[a].length && new_pair; b++) {
                      if (matches[a][b] === k){ 
                        matches[a].push(j)
                        new_pair = 0
                      }
                    }
                  }
                  if(new_pair){
                    matches.push([k,j])
                  }
                }
              }
              from_to.push([from,to]);
            }
            // else if(typeof from === "number" && typeof to === "undefined"){ // next is undefine
            //   // console.log(j + " " + dict["scores"][dict["teams"][j]][i] + " " + i)
            //   this.logoDataUpdater(j,dict["scores"][dict["teams"][j]][i],i)
            // }
          }

          // Sets up an array to track the active item in a matching group
          let active_matches_index = []
          for (let j = 0; j < matches.length; j++) {
            active_matches_index.push(0)
          }

          // Breaking down data into parts for dashed lines
          let d_s = [null,null,null,null,null]
          for (let j = 1; j < 12; j++) { // seperating into 12 segments because LCM of 1,2,3, and 4.
            let x_axis_value = i+(j*0.08333333333)
            for (let k = 0; k < 5; k++) {
              if(direction[k] === 0){
                d_s[k] = null
              }
              else{
                d_s[k] = t_s[k]+(j*0.08333333333*direction[k])
              }
            }
  
            let u_s = d_s.slice()
            for (let k = 0; k < matches.length; k++) {
              for(let a = 0; a < matches[k].length; a++){
                if(a !== active_matches_index[k]){
                  u_s[matches[k][a]] = null // only show one segment, rest null
                }
              }
            }
            new_data.push([x_axis_value,u_s[0],u_s[1],u_s[2],u_s[3],u_s[4]]) // this hack to get dashed lines needs two points at same x_axis
  
            u_s = d_s.slice()
            for (let k = 0; k < matches.length; k++) {
              active_matches_index[k] = (active_matches_index[k] + 1) % matches[k].length // shuffles the index to get the dashes
              for(let a = 0; a < matches[k].length; a++){
                if(a !== active_matches_index[k]){
                  u_s[matches[k][a]] = null // only show one segment, rest null
                }
              }
            }
            new_data.push([x_axis_value,u_s[0],u_s[1],u_s[2],u_s[3],u_s[4]]) // this hack to get dashed lines needs two points at same x_axis
          }
        }
      }
      else{
        new_data.push([i,null,null,null,null,null]) // scenario where theres empty data to fill the table
      }
    }
    let leading_team_index = dict["ranking"].indexOf(0);
    document.body.style.backgroundColor = dict["colors"][leading_team_index]
    
    this.setState({
      cur_data: new_data,
      options: {
        enableInteractivity: 'false',
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
            multiple: this.state.complete_data[this.state.season]["maxgames"] <= 20 ? 5 : 10
          },
          minorGridlines: {
            count: 0
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
            multiple: this.state.complete_data[this.state.season]["maxwinloss"] <= 20 ? 5 : 10
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
              {seasons_list.map((seasons_list_item) => (
                <option key={seasons_list_item} value={seasons_list_item}>{seasons_list_item}</option>
              ))}
            </select>
          </div>
          <div id="divisionContainer">
            <h2 className="dropdownTitle">Division:</h2>  
            <select className="minimal" value={this.state.division} onChange={(e) => this.handleDivisionChange(e.target.value)}>
              {divisions_list.map((divisions_list_item) => (
                <option key={divisions_list_item} value={divisions_list_item}>{divisions_list_item}</option>
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
              chartWrapperParams={{season : this.state.season}}
              getChartWrapper={chartWrapper => {
                this.setState({ chartWrapper });
              }}
            />
            <data id="logoCoordinates" value='{"coordinates":[null,null,null,null,null],"team_names":["MPT","MPT","MPT","MPT","MPT"]}'></data>
            {/* <img id="teamLogo0" className="teamLogo" alt="teamLogo0" src={blue}></img>
            <img id="teamLogo1" className="teamLogo" alt="teamLogo1" src={green}></img>
            <img id="teamLogo2" className="teamLogo" alt="teamLogo2" src={orange}></img>
            <img id="teamLogo3" className="teamLogo" alt="teamLogo3" src={red}></img>
            <img id="teamLogo4" className="teamLogo" alt="teamLogo4" src={yellow}></img> */}
            <img id="teamLogo0" className="teamLogo" alt="teamLogo0"></img>
            <img id="teamLogo1" className="teamLogo" alt="teamLogo1"></img>
            <img id="teamLogo2" className="teamLogo" alt="teamLogo2"></img>
            <img id="teamLogo3" className="teamLogo" alt="teamLogo3"></img>
            <img id="teamLogo4" className="teamLogo" alt="teamLogo4"></img>
          </div>
        </div>
        <h4 id="dataDisclaimer">Data was last sourced from <a href="https://www.baseball-reference.com/">baseball-reference.com</a>{this.state.data_date_disclaimer}</h4>
        {/* <a id="download_href" href="www.google.com" download={this.state.season + "_" + this.state.division + "_Standings.png"}>download</a> */}
      </div>
    );
  }
}

export default App;