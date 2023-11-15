import {React,useState,useEffect,useRef} from 'react';
import {doc,getDoc} from 'firebase/firestore';
import Parser from 'html-react-parser';
import {db} from '../components/firebase.js'
import Chart from '../components/chart.js'
import emptyChartOptions from '../data/emptyChartOptions';
import mlbChartOptions from '../data/mlbChartOptions';
import './standings.css';

var date = new Date();
var currentYear = date.getFullYear();
var currentMonth = date.getMonth();
var currentDay = date.getDate();

// Setting the currentYear back to last season's year if season hasn't started yet.
// This is based on the historical earliest regular season game played on March 20th.
if(currentMonth < 2 || (currentMonth === 2 && currentDay < 20)){
  currentYear = currentYear - 1;
}
var divisionsList = ['ALW','ALC','ALE','NLW','NLC','NLE'];
var seasonsList = [];
for (let year = currentYear; year >= 2013; year--){ // 2013 is last year of standings data avaliable.
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

// Hack to get direct link of logo images.
function importImagesDirectory(r) {
  let importedLogoImages = {};
  r.keys().map((item) => (importedLogoImages[item.replace('./', '')] = r(item)));
  return importedLogoImages;
}
const logoImages = importImagesDirectory(require.context('../images', false, /\.(png|jpe?g|svg)$/));

function StandingsPage() {
  const didMount = useRef(false);
  const [asterisk, setAsterisk] = useState('');
  const [completeData, setCompleteData] = useState({});
  const [season, setSeason] = useState(String(currentYear));
  const [division, setDivision] = useState('NLC');
  const [dateDataDisclaimer, setDateDataDisclaimer] = useState('');
  const [chartParams, setChartParams] = useState({
    'scaledLineWidth' : false, // Custom Google Charts Line Width scaling.
    'scaledChartArea' : false, // Custom Google Charts Chart Area scaling.
    'dashed' : false, // Custom Google Charts dashed line option for overlapping data.
    'logos' : logoImages, // Object containing mapping from team to path for logo.
    'ranking' : [], // Array ranking the teams division standings.
    'data': [], // Google Charts Data.
    'options' : emptyChartOptions, // Google Charts Options.
  });

  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason);
    document.getElementById('seasonSelect').blur();
  }

  const handleDivisionChange = (newDivision) => {
    setDivision(newDivision);
    document.getElementById('divisionSelect').blur();
  }

  useEffect(() => {
    if (!didMount.current) {
      return;
    }
    fetchSeasonData();
  }, [season,division]);

  const fetchSeasonData = () => {
    const firebaseRequest = async () => {
      if(season in completeData === false){
        const docRef = doc(db, 'seasons', season);
        const response = await getDoc(docRef);
        var seasonData = response.data();
        setCompleteData({
          ...completeData,
          [seasonData.year]: seasonData
        });
      }
      else{
        updateGraph();
      }
    }
    firebaseRequest();
  };

  useEffect(() => {
    if (!didMount.current) {
      return;
    }
    updateGraph();
  }, [completeData]);

  const updateGraph = () => {
    var dict = completeData[season]['divisions'][division];
    // Formatting scores data into Google Charts data array.
    var mostGamesPlayed = 0;
    for (let i = 0; i < 5; i++) {
      if(dict['scores'][dict['teams'][i]].length > mostGamesPlayed){
        mostGamesPlayed = dict['scores'][dict['teams'][i]].length;
      }
    }
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
    setDateDataDisclaimer('Data was last sourced from <a href="https://www.baseball-reference.com/">baseball-reference.com</a> on ' + disclaimer);
  }

  useEffect(() => {
    didMount.current = true;
    fetchSeasonData();
  },[]);

  return (
    <div className='App'>
      <h1 id='maintitle'>MLB Standings&nbsp;
        <a href='https://github.com/johnprovazek/mlbstandings'>
          <i className='fa fa-github' aria-hidden='true'></i>
        </a>
      </h1>
      <div id='dropdownContainer'>
        <div id='seasonContainer'>
          <h2 className='dropdownTitle'>Season:</h2>
          <select id='seasonSelect' className='minimal' value={season} onChange={e => handleSeasonChange(e.target.value)}>
            {seasonsList.map((seasonsListItem) => (
              <option key={seasonsListItem} value={seasonsListItem}>{seasonsListItem}</option>
            ))}
          </select>
        </div>
        <div id='divisionContainer'>
          <h2 className='dropdownTitle'>Division:</h2>  
          <select id='divisionSelect' className='minimal' value={division} onChange={e => handleDivisionChange(e.target.value)}>
            {divisionsList.map((divisionsListItem) => (
              <option key={divisionsListItem} value={divisionsListItem}>{divisionsListItem}</option>
            ))}
          </select>
        </div>
      </div>
      <div id='chartContainer'>
        <Chart chartParams={chartParams}/>
      </div>
      <h4 id='asterisk' className='footnotes'>{asterisk}</h4>
      <h4 id='dataDisclaimer' className='footnotes'>{Parser(dateDataDisclaimer)}</h4>
    </div>
  );
}

export default StandingsPage;