import { useState, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../components/firebase/firebase.jsx";
import Chart from "../../components/chart/chart.jsx";
import emptyChartOptions from "../../assets/data/emptyChartOptions.json";
import mlbChartOptions from "../../assets/data/mlbChartOptions.json";
import LoadingSvg from "../../assets/images/loading.svg";
import GithubSvg from "../../assets/images/github.svg";
const logoImports = import.meta.glob("../../assets/images/logos/*.svg", { eager: true });
import "./standings.css";

let date = new Date();
let currentYear = date.getFullYear();
let oldestYear = 2013;
if (date.getMonth() < 2) {
  currentYear = currentYear - 1;
}
let seasonsList = [];
for (let year = currentYear; year >= oldestYear; year--) {
  seasonsList.push(String(year));
}
let divisionsList = ["ALW", "ALC", "ALE", "NLW", "NLC", "NLE"];
let titleLabels = {
  ALW: "AL West",
  ALC: "AL Central",
  ALE: "AL East",
  NLW: "NL West",
  NLC: "NL Central",
  NLE: "NL East",
};

const StandingsPage = () => {
  const [season, setSeason] = useState(String(currentYear)); // Current season.
  const [division, setDivision] = useState("NLC"); // Current division.
  const [asterisk, setAsterisk] = useState(""); // Data irregularities note.
  const [dataDate, setDataDate] = useState(""); // Date data was sourced.
  const [chartStatus, setChartStatus] = useState("loading"); // Chart status ('loaded', 'loading', or 'unavailable').
  const [chartSettings, setChartSettings] = useState({
    // Chart component settings.
    scaledLineWidth: false, // Custom Google Charts line width scaling.
    dashedLines: false, // Custom Google Charts dashed line option for overlapping data.
    data: [], // Google Charts Data.
    logoPaths: [], // Logo paths with order matching data.
    options: emptyChartOptions, // Google Charts options.
  });

  const standingsData = useRef({}); // Complete standings data imported from Firebase.

  // Handles season dropdown changes.
  const handleSeasonChange = (event) => {
    setSeason(event.target.value);
    event.target.blur();
  };

  // Handles division dropdown changes.
  const handleDivisionChange = (event) => {
    setDivision(event.target.value);
    event.target.blur();
  };

  // Handles changes to season or division and requesting data from Firebase.
  useEffect(() => {
    // Updates page based on latest season or division changes.
    const updatePage = () => {
      // Scenario where season data is unavailable.
      if (standingsData.current[season] === null) {
        document.body.style.backgroundColor = "#000000";
        setAsterisk("");
        setDataDate("");
        setChartStatus("unavailable");
      }
      // Scenario where season data is available.
      else {
        let teamsDict = standingsData.current[season]["divisions"][division]["teams"];
        // Sorting teams by rank.
        let teams = Object.keys(teamsDict).sort(function (a, b) {
          return teamsDict[a]["rank"] - teamsDict[b]["rank"];
        });
        // Getting the most games played in a division, logo paths and colors.
        let mostGamesPlayed = 0;
        let logoPaths = [];
        let colors = [];
        teams.forEach((team) => {
          if (teamsDict[team]["scores"].length > mostGamesPlayed) {
            mostGamesPlayed = teamsDict[team]["scores"].length;
          }
          let logoPath = logoImports[Object.keys(logoImports).find((k) => k.includes(team))].default;
          logoPaths.push(logoPath);
          colors.push(teamsDict[team]["color"]);
        });
        // Formatting chart data to work with Google Charts.
        let formattedChartData = [];
        let chartLabel = ["Games Played"];
        teams.forEach((team) => {
          chartLabel.push(team);
        });
        formattedChartData.push(chartLabel);
        for (let i = 0; i < mostGamesPlayed; i++) {
          let dataRow = [i];
          teams.forEach((team) => {
            let winLossUnit = null;
            if (i < teamsDict[team]["scores"].length) {
              winLossUnit = teamsDict[team]["scores"][i];
            }
            dataRow.push(winLossUnit);
          });
          formattedChartData.push(dataRow);
        }
        // Setting Chart parameters used by Chart component.
        setChartSettings({
          scaledLineWidth: true,
          dashedLines: standingsData.current[season]["maxgames"] < 70 ? true : false,
          data: formattedChartData,
          logoPaths: logoPaths,
          options: {
            ...mlbChartOptions,
            title: season + " " + titleLabels[division] + " Standings",
            colors: colors,
            hAxis: {
              ...mlbChartOptions.hAxis,
              viewWindow: {
                max: standingsData.current[season]["maxgames"],
              },
              gridlines: {
                ...mlbChartOptions.hAxis.gridlines,
                multiple: standingsData.current[season]["maxgames"] < 20 ? 5 : 10,
              },
            },
            vAxis: {
              ...mlbChartOptions.vAxis,
              viewWindow: {
                max: standingsData.current[season]["maxwinloss"],
                min: standingsData.current[season]["maxwinloss"] * -1,
              },
              gridlines: {
                ...mlbChartOptions.vAxis.gridlines,
                multiple: standingsData.current[season]["maxwinloss"] < 20 ? 5 : 10,
              },
            },
          },
        });
        // Changing application background color to color of leading team in division.
        document.body.style.backgroundColor = teamsDict[teams[0]]["color"];
        // Updating asterisk value.
        setAsterisk(standingsData.current[season]["divisions"][division]["asterisk"]);
        // Updating data date value.
        let date = new Date(standingsData.current[season]["epochdate"] * 1000);
        let dateStyle = {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          timeZoneName: "short",
        };
        setDataDate(date.toLocaleDateString("en-US", dateStyle));
        // Displaying the chart.
        setChartStatus("loaded");
      }
    };
    // Handles changes to season or division and requests data from Firebase if missing.
    if (season in standingsData.current === false) {
      const firebaseRequest = async () => {
        setChartStatus("loading");
        const docRef = doc(db, "seasons", season);
        const response = await getDoc(docRef);
        standingsData.current = {
          ...standingsData.current,
          [season]: response.exists() ? response.data() : null,
        };
        updatePage();
      };
      firebaseRequest();
    } else {
      updatePage();
    }
  }, [season, division]);

  return (
    <div className="App">
      <div id="standings-page">
        <h1 id="main-title">
          MLB Standings&nbsp;
          <a href="https://github.com/johnprovazek/mlbstandings">
            <img id="github-svg" src={GithubSvg} alt="Github SVG" />
          </a>
        </h1>
        <div id="dropdown-container">
          <div id="season-container">
            <h2 className="dropdown-title">Season:</h2>
            <select
              id="season-select"
              className="dropdown-select"
              value={season}
              onChange={(e) => handleSeasonChange(e)}
            >
              {seasonsList.map((seasonsListItem) => (
                <option key={seasonsListItem} value={seasonsListItem}>
                  {seasonsListItem}
                </option>
              ))}
            </select>
          </div>
          <div id="divisionContainer">
            <h2 className="dropdown-title">Division:</h2>
            <select
              id="division-select"
              className="dropdown-select"
              value={division}
              onChange={(e) => handleDivisionChange(e)}
            >
              {divisionsList.map((divisionsListItem) => (
                <option key={divisionsListItem} value={divisionsListItem}>
                  {divisionsListItem}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div id="chart-container">
          {chartStatus === "loaded" && <Chart chartSettings={chartSettings}></Chart>}
          {chartStatus === "loading" && <img id="loading-svg" src={LoadingSvg} alt="Loading SVG" />}
          {chartStatus === "unavailable" && (
            <div id="unavailable-data">
              <h2>Season data currently unavailable</h2>
            </div>
          )}
        </div>
        <h4 id="asterisk" className="footnotes">
          {asterisk}
        </h4>
        {dataDate !== "" && (
          <h4 id="data-disclaimer" className="footnotes">
            Data was last sourced from <a href="https://www.baseball-reference.com">baseball-reference.com</a> on{" "}
            {dataDate}
          </h4>
        )}
      </div>
    </div>
  );
};

export default StandingsPage;
