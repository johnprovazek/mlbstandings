import {React}  from 'react';
import {useState}  from 'react';
import {useEffect}  from 'react';
import {useRef}  from 'react';
import {doc} from 'firebase/firestore';
import {getDoc} from 'firebase/firestore';
import Parser from 'html-react-parser';
import {db} from '../components/firebase'
import Chart from '../components/chart.js'
import emptyChartOptions from '../data/emptyChartOptions';
import mlbChartOptions from '../data/mlbChartOptions';
import './standings.css';

var date = new Date()
var current_year = date.getFullYear()
var current_month = date.getMonth()
var current_day = date.getDate()

// Setting year back to last season's year if season hasn't started yet.
// Based on the historical earliest regular season game that started on March 20th.
if(current_month < 2 || (current_month === 2 && current_day < 20)){
  current_year = current_year - 1;
}

var divisions_list = ['ALW','ALC','ALE','NLW','NLC','NLE']
var seasons_list = []
for (let year = current_year; year >= 2013; year--) { // 2013 is last year of standings data avaliable.
  seasons_list.push(String(year))
}
var title_label_dict ={
  'ALW': 'AL West',
  'ALC': 'AL Central',
  'ALE': 'AL East',
  'NLW': 'NL West',
  'NLC': 'NL Central',
  'NLE': 'NL East',
}

function importImagesDirectory(r) {
  let logoImages = {};
  r.keys().map((item) => { logoImages[item.replace('./', '')] = r(item); });
  return logoImages;
}
const logoImages = importImagesDirectory(require.context('../images', false, /\.(png|jpe?g|svg)$/));

function StandingsPage() {
  const didMount = useRef(false);
  
  const [astrisk, setAstrisk] = useState('');
  const [completeData, setCompleteData] = useState({});
  const [season, setSeason] = useState(String(current_year));
  const [division, setDivision] = useState('NLC');
  const [dateDataDisclaimer, setDateDataDisclaimer] = useState('');
  const [chartParams, setChartParams] = useState({
    'scaledLineWidth' : false, // Custom Google Charts Line Width scaling
    'scaledChartArea' : false, // Custom Google Charts Chart Area scaling
    'dashed' : false, // Custom Google Charts dashed line option for overlapping data
    'logos' : logoImages, // Object containing mapping from team to path for logo
    'ranking' : [], // Array ranking the teams division standings
    'data': [], // Google Charts Data
    'options' : emptyChartOptions, // Google Charts Options
  })

  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason)
    document.getElementById('seasonSelect').blur();
  }

  const handleDivisionChange = (newDivision) => {
    setDivision(newDivision)
    document.getElementById('divisionSelect').blur();
  }

  useEffect(() => {
    if (!didMount.current) {
      return;
    }
    fetchSeasonData()
  }, [season,division]);

  const fetchSeasonData = () => {
    const firebaseRequest = async () => {
      if(season in completeData === false){
        const docRef = doc(db, 'seasons', season)
        const response = await getDoc(docRef)
        var seasonData = response.data()
        setCompleteData({
          ...completeData,
          [seasonData.year]: seasonData
        })
      }
      else{
        updateGraph();
      }
    }
    firebaseRequest()
  };

  useEffect(() => {
    if (!didMount.current) {
      return;
    }
    updateGraph();
  }, [completeData]);

  const updateGraph = () => {
    var dict = completeData[season]['divisions'][division]
    
    // Formatting scores data into Google Charts data array
    var most_games_played = 0
    for (let i = 0; i < 5; i++) {
      if(dict['scores'][dict['teams'][i]].length > most_games_played){
        most_games_played = dict['scores'][dict['teams'][i]].length
      }
    }
    var formatted_chart_data = []
    formatted_chart_data.push(['Games Played', dict['teams'][0], dict['teams'][1], dict['teams'][2], dict['teams'][3], dict['teams'][4]]);
    for (let i = 0; i < most_games_played; i++) {
      let data_row = []
      for (let j = 0; j < 5; j++) {
        let win_loss_unit = null
        if (i < dict['scores'][dict['teams'][j]].length){
          win_loss_unit = dict['scores'][dict['teams'][j]][i]
        }
        data_row.push(win_loss_unit)
      }
      formatted_chart_data.push([i,data_row[0],data_row[1],data_row[2],data_row[3],data_row[4]])
    }
    setChartParams({
      'scaledLineWidth' : true,
      'scaledChartArea' : true,
      'dashed' : completeData[season]['maxgames'] < 70 ? true : false,
      'logos' : logoImages,
      'ranking' : dict['ranking'],
      'data': formatted_chart_data,
      'options' : {
        ...mlbChartOptions,
        title: season + ' ' + title_label_dict[division] + ' Standings',
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

    // Changing the pages background color to the color of the winning team
    let leading_team_index = dict['ranking'].indexOf(0);
    document.body.style.backgroundColor = dict['colors'][leading_team_index]

    // Updating the asterisk value for seasons with data asterisk
    setAstrisk(dict['asterisk'])

    // Updating the date data disclaimer
    let date = new Date(0)
    date.setUTCSeconds(completeData[season]['epochdate'])
    let date_style = { year: 'numeric', month: 'long', day: 'numeric' , hour: 'numeric', minute: 'numeric', timeZoneName: 'short'}
    let disclaimer = date.toLocaleDateString('en-US', date_style)
    setDateDataDisclaimer('Data was last sourced from <a href="https://www.baseball-reference.com/">baseball-reference.com</a> on ' + disclaimer)
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
            {seasons_list.map((seasons_list_item) => (
              <option key={seasons_list_item} value={seasons_list_item}>{seasons_list_item}</option>
            ))}
          </select>
        </div>
        <div id='divisionContainer'>
          <h2 className='dropdownTitle'>Division:</h2>  
          <select id='divisionSelect' className='minimal' value={division} onChange={e => handleDivisionChange(e.target.value)}>
            {divisions_list.map((divisions_list_item) => (
              <option key={divisions_list_item} value={divisions_list_item}>{divisions_list_item}</option>
            ))}
          </select>
        </div>
      </div>
      <div id='chartContainer'>
        <Chart chartParams={chartParams}/>
      </div>
      <h4 id='astrisk' className='footnotes'>{astrisk}</h4>
      <h4 id='dataDisclaimer' className='footnotes'>{Parser(dateDataDisclaimer)}</h4>
    </div>
  );
}

export default StandingsPage;