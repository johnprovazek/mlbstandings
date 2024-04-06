import {React,useState,useEffect,useRef} from 'react';
import {doc,getDoc} from 'firebase/firestore';
import Parser from 'html-react-parser';
import {db} from '../components/firebase.js'
import Chart from '../components/chart.js'
import emptyChartOptions from '../data/emptyChartOptions';
import mlbChartOptions from '../data/mlbChartOptions';
import './standings.css';
import LoadingSvg from '../images/loading.svg';

var date = new Date();
var currentYear = date.getFullYear();
if(date.getMonth() < 2){ // Setting the currentYear back to last season's year if earlier than March (earliest historic opening day was March 20th).
  currentYear = currentYear - 1;
}
var divisionsList = ['ALW','ALC','ALE','NLW','NLC','NLE'];
var seasonsList = [];
for (let year = currentYear; year >= 2013; year--){ // 2013 is the last year of standings data available currently.
  seasonsList.push(String(year));
}
var titleLabels = {
  'ALW': 'AL West',
  'ALC': 'AL Central',
  'ALE': 'AL East',
  'NLW': 'NL West',
  'NLC': 'NL Central',
  'NLE': 'NL East',
};
function importImagesDirectory(r) { // Hack to get direct link of logo images.
  let importedLogoImages = {};
  r.keys().map((item) => (importedLogoImages[item.replace('./', '')] = r(item)));
  return importedLogoImages;
}
const logoImages = importImagesDirectory(require.context('../images/logos', false, /\.(png|jpe?g|svg)$/));

function StandingsPage() {
  const didMount = useRef(false); // This value is set to true when the component mounts.
  const [asterisk, setAsterisk] = useState(''); // Note at bottom of the chart indicating any irregularities with the data.
  const [completeData, setCompleteData] = useState({}); // Complete data imported from firebase.
  const [season, setSeason] = useState(String(currentYear)); // Value of current season to display.
  const [division, setDivision] = useState('NLC'); // Value of current division to display.
  const [dateDataDisclaimer, setDateDataDisclaimer] = useState(''); // Note at bottom of the chart indicating the date the data was last sourced.
  const [chartDisplay, setChartDisplay] = useState('loading'); // Displays different chart options. Options are ('chart', 'loading', and 'unavailable').
  const [chartParams, setChartParams] = useState({
    'scaledLineWidth' : false, // Custom Google Charts Line Width scaling.
    'scaledChartArea' : false, // Custom Google Charts Chart Area scaling.
    'dashed' : false, // Custom Google Charts dashed line option for overlapping data.
    'logos' : logoImages, // Object containing mapping from team to path for logo.
    'ranking' : [], // Array ranking the teams division standings.
    'data': [], // Google Charts Data.
    'options' : emptyChartOptions // Google Charts Options.
  });

  // Handles when the season dropdown value is changed.
  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason);
    document.getElementById('season-select').blur();
  }

  // Handles when the division dropdown value is changed.
  const handleDivisionChange = (newDivision) => {
    setDivision(newDivision);
    document.getElementById('division-select').blur();
  }

  // Triggers fetching new season data if the season of division value is changed.
  useEffect(() => {
    if (!didMount.current) {
      return;
    }
    fetchSeasonData();
  }, [season,division]);

  // Handles calling firebase request to get new data.
  const fetchSeasonData = () => {
    const firebaseRequest = async () => {
      if(season in completeData === false){
        const docRef = doc(db, 'seasons', season);
        setChartDisplay('loading');
        const response = await getDoc(docRef);
        setCompleteData({
          ...completeData,
          [season]: response.exists() ? response.data() : null
        });
      }
      else{
        updateChart();
      }
    }
    firebaseRequest();
  };

  // If completeData was changed call updateChart.
  useEffect(() => {
    if (!didMount.current) {
      return;
    }
    updateChart();
  }, [completeData]);

  // Handles updates the chart and details.
  const updateChart = () => {
    if(completeData[season] === null){ // Scenario where firebase data is either missing or failed to load.
      document.body.style.backgroundColor = '#000000'; // Changing the pages background color to black.
      setAsterisk(''); // Updating the asterisk value to an empty string.
      setDateDataDisclaimer(''); // Updating the date data disclaimer to an empty string.
      setChartDisplay('unavailable'); // Adding the data unavailable text.
    }
    else{ // Scenario where firebase data has been successfully loaded.
      var dict = completeData[season]['divisions'][division];
      // Finding the most games played in the division.
      var mostGamesPlayed = 0;
      for (let i = 0; i < 5; i++) {
        if(dict['scores'][dict['teams'][i]].length > mostGamesPlayed){
          mostGamesPlayed = dict['scores'][dict['teams'][i]].length;
        }
      }
      // Formatting the chart data to work with Google Charts.
      var formattedChartData = [];
      formattedChartData.push(['Games Played', dict['teams'][0], dict['teams'][1], dict['teams'][2], dict['teams'][3], dict['teams'][4]]);
      for (let i = 0; i < mostGamesPlayed; i++) {
        let dataRow = [];
        for (let j = 0; j < 5; j++) {
          let winLossUnit = null;
          if (i < dict['scores'][dict['teams'][j]].length){
            winLossUnit = dict['scores'][dict['teams'][j]][i];
          }
          dataRow.push(winLossUnit);
        }
        formattedChartData.push([i,dataRow[0],dataRow[1],dataRow[2],dataRow[3],dataRow[4]]);
      }
      setChartParams({
        'scaledLineWidth' : true,
        'scaledChartArea' : true,
        'dashed' : completeData[season]['maxgames'] < 70 ? true : false,
        'logos' : logoImages,
        'ranking' : dict['ranking'],
        'data': formattedChartData,
        'options' : {
          ...mlbChartOptions,
          title: season + ' ' + titleLabels[division] + ' Standings',
          colors: [dict['colors'][0], dict['colors'][1], dict['colors'][2], dict['colors'][3], dict['colors'][4]],
          hAxis: {
            ...mlbChartOptions.hAxis,
            viewWindow: {
              max: completeData[season]['maxgames']
            },
            gridlines: {
              ...mlbChartOptions.hAxis.gridlines,
              multiple: completeData[season]['maxgames'] < 20 ? 5 : 10
            },
          },
          vAxis: {
            ...mlbChartOptions.vAxis,
            viewWindow: {
              max: completeData[season]['maxwinloss'],
              min: completeData[season]['maxwinloss'] * -1
            },
            gridlines: {
              ...mlbChartOptions.vAxis.gridlines,
              multiple: completeData[season]['maxwinloss'] < 20 ? 5 : 10
            },
          }
        }
      })
      // Changing the pages background color to the color of the winning team.
      let leadingTeamIndex = dict['ranking'].indexOf(0);
      document.body.style.backgroundColor = dict['colors'][leadingTeamIndex];
      // Updating the asterisk value for seasons with data asterisk.
      setAsterisk(dict['asterisk']);
      // Updating the date data disclaimer.
      let date = new Date(0);
      date.setUTCSeconds(completeData[season]['epochdate']);
      let dateStyle = { year: 'numeric', month: 'long', day: 'numeric' , hour: 'numeric', minute: 'numeric', timeZoneName: 'short'};
      let disclaimer = date.toLocaleDateString('en-US', dateStyle);
      setDateDataDisclaimer('Data was last sourced from <a href=\'https://www.baseball-reference.com/\'>baseball-reference.com</a> on ' + disclaimer);
      // Displaying the chart.
      setChartDisplay('chart');
    }
  }

  // Runs on initial render.
  useEffect(() => {
    didMount.current = true;
    fetchSeasonData();
  },[]);

  return (
    <div className='App'>
      <div id='standings-page'>
        <h1 id='main-title'>MLB Standings&nbsp;
          <a href='https://github.com/johnprovazek/mlbstandings'>
            <i className='fa fa-github' aria-hidden='true'></i>
          </a>
        </h1>
        <div id='dropdown-container'>
          <div id='season-container'>
            <h2 className='dropdown-title'>Season:</h2>
            <select id='season-select' className='dropdown-select' value={season} onChange={e => handleSeasonChange(e.target.value)}>
              {seasonsList.map((seasonsListItem) => (
                <option key={seasonsListItem} value={seasonsListItem}>{seasonsListItem}</option>
              ))}
            </select>
          </div>
          <div id='divisionContainer'>
            <h2 className='dropdown-title'>Division:</h2>
            <select id='division-select' className='dropdown-select' value={division} onChange={e => handleDivisionChange(e.target.value)}>
              {divisionsList.map((divisionsListItem) => (
                <option key={divisionsListItem} value={divisionsListItem}>{divisionsListItem}</option>
              ))}
            </select>
          </div>
        </div>
        <div id='chart-container'>
          {chartDisplay === 'chart' && <Chart chartParams={chartParams}/>}
          {chartDisplay === 'loading' && <img id='loading-svg' src={LoadingSvg} alt='Loading SVG'/>}
          {chartDisplay === 'unavailable' && <div id='unavailable-data'><h2>Season data currently unavailable</h2></div>}
        </div>
        <h4 id='asterisk' className='footnotes'>{asterisk}</h4>
        <h4 id='data-disclaimer' className='footnotes'>{Parser(dateDataDisclaimer)}</h4>
      </div>
    </div>
  );
}

export default StandingsPage;