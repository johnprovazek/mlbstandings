import { useState } from "react";
import Chart from "../../components/Chart/Chart.jsx";
import Dropdowns from "../../components/Dropdowns/Dropdowns.jsx";
import Footnote from "../../components/Footnote/Footnote.jsx";
import LoadingBox from "../../components/LoadingBox/LoadingBox.jsx";
import StandingsTable from "../../components/StandingsTable/StandingsTable.jsx";
import Title from "../../components/Title/Title.jsx";
import LoadingSVG from "../../assets/images/loading.svg";
import MLBChartOptions from "../../assets/data/mlb-chart-options.json";
import UnavailableSVG from "../../assets/images/unavailable.svg";
import useFirebaseStandings from "../../hooks/useFirebaseStandings.jsx";
import { useLocalStorage } from "@uidotdev/usehooks";
import { epochToDateString } from "../../lib/utils.js";
import {
  DIVISIONS_LIST,
  DIVISION_LABELS,
  OLDEST_YEAR,
  MLB_STANDINGS_BLACK,
  DIVISION_DEFAULT,
} from "../../lib/constants.js";
import "./StandingsPage.css";

// Handles overriding base MLB Google Charts options with season and division specific options.
const buildChartOptions = (title, maxGames, maxWinLoss, colors) => {
  return {
    ...MLBChartOptions,
    title: title,
    colors: colors,
    hAxis: {
      ...MLBChartOptions.hAxis,
      viewWindow: {
        max: maxGames,
      },
      gridlines: {
        ...MLBChartOptions.hAxis.gridlines,
        multiple: maxGames < 20 ? 5 : 10,
      },
    },
    vAxis: {
      ...MLBChartOptions.vAxis,
      viewWindow: {
        max: maxWinLoss,
        min: -maxWinLoss,
      },
      gridlines: {
        ...MLBChartOptions.vAxis.gridlines,
        multiple: maxWinLoss < 20 ? 5 : 10,
      },
    },
  };
};

// Handles formatting data for use with Google Charts.
const formatGoogleChartData = (standingsList) => {
  if (!standingsList.length) {
    return null;
  }

  const mostGamesPlayed = standingsList.reduce((max, team) => Math.max(max, team.scores.length), 0);
  const googleChartData = [["Games Played", ...standingsList.map((obj) => obj.code)]];

  for (let i = 0; i < mostGamesPlayed; i++) {
    const dataRow = [i];
    standingsList.forEach((team) => {
      dataRow.push(team.scores[i] ?? null);
    });
    googleChartData.push(dataRow);
  }
  return googleChartData;
};

// Handles parsing season data from firebase.
const parseSeasonData = (seasonData, division) => {
  if (!seasonData || !seasonData.divisions[division]) {
    return {
      leadTeamColor: MLB_STANDINGS_BLACK,
      asterisk: "",
      date: "",
      dashed: undefined,
      chartData: undefined,
      chartOptions: undefined,
      logoPaths: undefined,
      tableData: undefined,
    };
  }

  const { epochDate, year, maxGames, maxWinLoss } = seasonData;
  const { standings, asterisk } = seasonData.divisions[division];

  const activeStandings = standings.filter((team) => team.scores.length > 1);
  const activeColors = activeStandings.map((obj) => obj.color);
  const activeLogoPaths = activeStandings.map((obj) => LOGOS[obj.code] ?? null);
  const title = `${year} ${DIVISION_LABELS[division]} Standings`;
  const chartData = formatGoogleChartData(activeStandings);
  const tableData = standings.map((obj) => ({
    ...obj.table,
    logo: LOGOS[obj.code] ?? null,
    color: obj.color,
    code: obj.code,
  }));

  return {
    leadTeamColor: standings[0].color,
    asterisk,
    date: `Data from ${epochToDateString(epochDate)}`,
    dashed: maxGames < 70,
    chartData: chartData,
    chartOptions: buildChartOptions(title, maxGames, maxWinLoss, activeColors),
    logoPaths: activeLogoPaths,
    tableData: chartData ? tableData : undefined,
  };
};

const DIVISION_KEY_NAME = "mlbstandings-division";
const CURRENT_YEAR = new Date().getMonth() < 2 ? new Date().getFullYear() - 1 : new Date().getFullYear();
const SEASONS_LIST = Array.from({ length: CURRENT_YEAR - OLDEST_YEAR + 1 }, (_, index) => String(CURRENT_YEAR - index));
const LOGOS = Object.entries(import.meta.glob("../../assets/images/logos/*.svg", { eager: true })).reduce(
  (acc, [path, module]) => {
    const filename = path.split("/").pop().replace(".svg", "");
    acc[filename] = module.default;
    return acc;
  },
  {},
);

const StandingsPage = () => {
  const [season, setSeason] = useState(String(CURRENT_YEAR)); // Current season.
  const [division, setDivision] = useLocalStorage(DIVISION_KEY_NAME, DIVISION_DEFAULT); // Current division.
  const [showTable, setShowTable] = useState(false); // Flag to display or hide standings table.
  const { seasonData, isSuccess, isPending, isError } = useFirebaseStandings(season); // Gathering Firebase season data.
  const { leadTeamColor, asterisk, date, dashed, chartData, chartOptions, logoPaths, tableData } = parseSeasonData(
    seasonData,
    division,
  );

  const handleChartClick = () => {
    setShowTable(!showTable);
  };

  return (
    <div id="standings-page" style={{ backgroundColor: leadTeamColor }}>
      <div id="standings-page-container">
        <Title />
        <Dropdowns
          seasons={SEASONS_LIST}
          season={season}
          handleSeasonChange={setSeason}
          divisions={DIVISIONS_LIST}
          division={division}
          handleDivisionChange={setDivision}
        />
        <div id="chart-standings-table-container" onClick={handleChartClick}>
          <div className="wide-aspect-container">
            {isSuccess && (
              <Chart
                scaledLineWidth={true}
                dashed={dashed}
                data={chartData}
                options={chartOptions}
                logoPaths={logoPaths}
                noDataImage={UnavailableSVG}
              />
            )}
            {isPending && <LoadingBox image={LoadingSVG} />}
            {isError && <LoadingBox image={UnavailableSVG} />}
          </div>
          {showTable && (
            <div className="wide-aspect-container">
              {isSuccess && <StandingsTable data={tableData} />}
              {isPending && <LoadingBox image={LoadingSVG} />}
              {isError && <LoadingBox image={UnavailableSVG} />}
            </div>
          )}
        </div>
        <Footnote>{asterisk}</Footnote>
        <Footnote>{date}</Footnote>
      </div>
    </div>
  );
};

export default StandingsPage;
