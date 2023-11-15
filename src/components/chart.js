import { useEffect, useState } from 'react';
import useGoogleCharts from './useGoogleCharts';
import './chart.css';
import LoadingSvg from "../images/loading.svg";

function Chart(props) {
  const [title, setTitle] = useState('');
  const [wrapper, setWrapper] = useState(null);
  const [logoCoordinates, setLogoCoordinates] = useState([]);
  const [containerWidth, setContainerWidth] = useState(null);
  const [containerHeight, setContainerHeight] = useState(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  const google = useGoogleCharts();

  const processData = (data) => {
    // Get the team names and x and y coordinates of the last items and include ranking.
    let coords = [null,null,null,null,null];
    for (let i = 1; i < props.chartParams.ranking.length+1; i++) {
      for(let j = data.length-1; j > 0; j--) {
        if (data[j][i] !== null) {
          coords[i-1] = {
            'ranking': props.chartParams.ranking[i-1],
            'team' : data[0][i],
            'x' : j-1,
            'y' : data[j][i]
          }
          break;
        }
      }
    }
    setLogoCoordinates(coords);

    // Modify the table data to show dashed lines.
    if(props.chartParams.dashed){
      return addDashedData(data);
    }
    else{
      return data;
    }
  }

  const addDashedData = (data) => {
    // Creating the new dashed table.
    const dashTable = [];
    dashTable.push(data[0]);

    // Filling the table with extra data to add dashed lines.
    for (let i = 1; i < data.length - 1; i++) {
      dashTable.push(data[i]); // Adding the same data twice to avoid dots in the chart.
      dashTable.push(data[i]); // Adding the same data twice to avoid dots in the chart.
      let fromTo = []; // 2D array of the win/loss records between two games for all five teams in a division.
      let direction = [0,0,0,0,0]; // Direction of the slope of the line between two games. 1 for win. -1 for loss. 0 if first game is last game played.
      let matches = []; // 2D array of the matching groups with same slope between games.
      for (let j = 1; j < 6; j++) {
        let from = data[i][j];
        let to = data[i+1][j];
        if(to !== null){ // Looking at the next team win/loss score, could be null.
          direction[j-1] = (from > to) ? -1 : 1;
          // Bundles matching pairs in a 2d array.
          let newPair = 1;
          for (let k = 0; k < fromTo.length && newPair; k++) {
            if(fromTo[k].toString() === [from,to].toString()){
              for (let a = 0; a < matches.length && newPair; a++) {
                for (let b = 0; b < matches[a].length && newPair; b++) {
                  if (matches[a][b] === k){
                    matches[a].push(j-1);
                    newPair = 0;
                  }
                }
              }
              if(newPair){
                matches.push([k,j-1]);
              }
            }
          }
          fromTo.push([from,to]);
        }
      }

      // Sets up an array to track the active item in a matching group.
      let activeMatchesIndex = [];
      for (let j = 0; j < matches.length; j++) {
        activeMatchesIndex.push(0);
      }

      // Breaking down data into parts for dashed lines.
      let segments = 12; // Seperating into 12 segments per line because 12 is the LCM of 1,2,3, and 4.
      let dashSegments = [null,null,null,null,null];
      for (let j = 1; j < segments; j++) {
        let xAxisValue = (i-1) + (j*(1/segments));
        for (let k = 0; k < 5; k++) {
          if(direction[k] === 0){
            dashSegments[k] = null;
          }
          else{
            dashSegments[k] =  data[i][k+1]+(j*(1/segments)*direction[k]);
          }
        }
        let unitSegments = dashSegments.slice();
        for (let k = 0; k < matches.length; k++) {
          for(let a = 0; a < matches[k].length; a++){
            if(a !== activeMatchesIndex[k]){
              unitSegments[matches[k][a]] = null; // Only show one segment, rest null.
            }
          }
        }
        dashTable.push([xAxisValue,unitSegments[0],unitSegments[1],unitSegments[2],unitSegments[3],unitSegments[4]]); // This hack to get dashed lines needs two points at same x axis.
        unitSegments = dashSegments.slice();
        for (let k = 0; k < matches.length; k++) {
          activeMatchesIndex[k] = (activeMatchesIndex[k] + 1) % matches[k].length; // Shuffles the index to get the dashes.
          for(let a = 0; a < matches[k].length; a++){
            if(a !== activeMatchesIndex[k]){
              unitSegments[matches[k][a]] = null; // Only show one segment, rest null.
            }
          }
        }
        dashTable.push([xAxisValue,unitSegments[0],unitSegments[1],unitSegments[2],unitSegments[3],unitSegments[4]]); // This hack to get dashed lines needs two points at same x axis.
      }
    }
    dashTable.push(data[data.length-1]); // Adding the same data twice to avoid dots in the chart.
    dashTable.push(data[data.length-1]); // Adding the same data twice to avoid dots in the chart.
    return dashTable;
  }

  const processOptions = (options) => {
    let containerWidth = document.getElementById('chartComponentContainer').clientWidth;
    // Deleting title from google charts options and using custom title implementation.
    if(options['title'] !== null && typeof options['title'] !== 'undefined'){
      setTitle(options['title']);
      options['title'] = null;
    }
    // Sets title backgroundColor to chart backgroundColor if one exists.
    if(options['backgroundColor'] !== null && typeof options['backgroundColor'] !== 'undefined'){
      document.getElementById('chartComponentTitle').style.backgroundColor = options['backgroundColor'];
    }
    else{
      document.getElementById('chartComponentTitle').style.backgroundColor = 'white';
    }
    // Resizing the chart title.
    document.getElementById('chartComponentTitle').style.fontSize = Math.min(containerWidth/30, 24) + 'px';
    // Modify the chartArea and axis values.
    if(props.chartParams.scaledChartArea){
      // Sets the sidebars all equal in width.
      options['chartArea'] = {
        ...options.chartArea,
        top: '2.5%',
        bottom: '13.6111111111%',
        left: '6.125%',
        right: '6.125%'
      };
      let textStyleTemplate = {
        color: '#000000',
        fontName: 'Arial',
        fontSize: 16,
        bold: true,
        italic: false
      };
      options['hAxis']['textStyle'] = {
        ...textStyleTemplate,
        fontSize: Math.min(containerWidth/60, 16)
      }
      options['hAxis']['titleTextStyle'] = {
        ...textStyleTemplate,
        fontSize: Math.min(containerWidth/60, 16)
      }
      options['vAxis']['textStyle'] = {
        ...textStyleTemplate,
        fontSize: Math.min(containerWidth/60, 16)
      }
      options['vAxis']['titleTextStyle'] = {
        ...textStyleTemplate,
        fontSize: Math.min(containerWidth/60, 16)
      }
    }
    // Modify the lineWidth.
    if(props.chartParams.scaledLineWidth){
      let maxGames = 1;
      if (options['hAxis']['viewWindow']['max'] != null){
        maxGames = options['hAxis']['viewWindow']['max'];
      }
      let chartWidth = document.getElementById('chartComponentStandingsChart').clientWidth;
      let lineScaleMultiplier = 1;
      if(chartWidth < 769){
        lineScaleMultiplier = 0.0020833333333333333 * (chartWidth) - 0.6;
      }
      let scaledLineWidth = (0.000141026 * Math.pow(maxGames, 2) - 0.0488462*(maxGames) + 6.728210) * lineScaleMultiplier;
      options['lineWidth'] = scaledLineWidth;
    }
    return options;
  }

  useEffect(() => {
    if (google && props.chartParams && props.chartParams.data.length) {
      setChartLoaded(true);
      // Turning off display of Logos.
      const logoElements = document.getElementsByClassName('teamLogo');
      for (let i = 0; i < logoElements.length; i++) {
        logoElements[i].style.display = 'none';
      }
      const pData = processData(props.chartParams.data);
      const pOptions = processOptions(props.chartParams.options);
      const newWrapper = new google.visualization.ChartWrapper({
        containerId: 'chartComponentStandingsChart',
        chartType: 'LineChart',
        dataTable: google.visualization.arrayToDataTable(pData),
        options: pOptions,
      });
      setWrapper(newWrapper);
    }
  }, [google, props.chartParams]);

  const addTeamLogos = () => {
    let layout = wrapper.getChart().getChartLayoutInterface();
    let chartWidth = layout.getChartAreaBoundingBox()['width'];
    let logoWidth = 40;
    if (chartWidth < 677){
      logoWidth = chartWidth/16.925;
    }
    // Fill in new dictionary with x and y coordinates from the google chart.
    var newLogoCoordinates = []; // New logo coordinates.
    for (let i = 0; i < logoCoordinates.length; i++) {
      newLogoCoordinates.push({
        'team' : logoCoordinates[i]['team'],
        'ranking' : logoCoordinates[i]['ranking'],
        'x' : Math.floor(layout.getXLocation(logoCoordinates[i]['x'])),
        'y' : Math.floor(layout.getYLocation(logoCoordinates[i]['y'])),
      });
    }

    // Add in team logos to the end of the chart.
    let containerWidth = document.getElementById('chartComponentGoogleChartContainer').clientWidth;
    let containerHeight = document.getElementById('chartComponentGoogleChartContainer').clientHeight;
    for (let i = 0; i < newLogoCoordinates.length; i++) {
      var teamLogo = document.getElementById('teamLogo' + i);
      teamLogo.style.display = 'block';
      teamLogo.src=props.chartParams.logos[logoCoordinates[i]['team'] + '.svg'];
      teamLogo.width = logoWidth;
      teamLogo.height = logoWidth;
      let logoLeft = newLogoCoordinates[i]['x'];
      let logoTop = newLogoCoordinates[i]['y'] - logoWidth/2;
      teamLogo.style.left = (logoLeft/containerWidth) * 100 + '%';
      teamLogo.style.top = (logoTop/containerHeight) * 100 + '%';
      teamLogo.style.borderColor = props.chartParams.options['colors'][i];
      teamLogo.style.borderWidth = wrapper.getOptions().lineWidth + 'px';
      teamLogo.style.borderRadius = wrapper.getOptions().lineWidth + 'px';
      teamLogo.style.zIndex = Math.abs(newLogoCoordinates[i]['ranking'] - (newLogoCoordinates.length - 1));
    }
  }

  useEffect(() => {
    if (google && props.chartParams) {
      google.visualization.events.addListener(wrapper, 'ready', addTeamLogos);
      wrapper.draw();
    }
  }, [wrapper]);

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      let chartContainerElement = document.getElementById('chartComponentContainer');
      let curContainerWidth = 0;
      let curContainerHeight = 0;
      if (chartContainerElement !== null) {
        curContainerWidth = chartContainerElement.clientWidth;
        curContainerHeight = chartContainerElement.clientHeight;
      }
      if(wrapper && google && props.chartParams && containerWidth && containerHeight && curContainerWidth && curContainerHeight){
        // If the container width or height has changed by more than 15% trigger a redrawn chart.
        if(Math.abs((containerWidth - curContainerWidth)/containerWidth) >= 0.15 || 
            Math.abs((containerHeight - curContainerHeight)/containerHeight) >= 0.15){
          clearTimeout(timeoutId);
          redraw(curContainerWidth,curContainerHeight);
        }
        else{
          toggleSvg(true); // Temporarily show SVG.
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => redraw(curContainerWidth,curContainerHeight), 100);
        }
      }
    }

    const redraw = (width, height) => {
      toggleSvg(false); // Remove SVG.
      const pOptions = processOptions(props.chartParams.options);
      wrapper.setOptions(pOptions);
      wrapper.draw();
      setContainerWidth(width);
      setContainerHeight(height);
    }

    const toggleSvg = (option) => {
      let svgChartElement = document.getElementById('svgChart');
      let googleChartElement = document.getElementById('chartComponentStandingsChart');
      if(option){
        var svgGoogle = document.getElementById('chartComponentStandingsChart').getElementsByTagName('div')[0].getElementsByTagName('div')[0].getElementsByTagName('div')[0].getElementsByTagName('svg')[0].cloneNode(true);
        svgGoogle.id = 'svgChart';
        let width = svgGoogle.width['animVal']['value'];
        let height = svgGoogle.height['animVal']['value'];
        let viewboxString = '0 0 ' + width + ' ' + height;
        svgGoogle.setAttribute('viewBox', viewboxString);
        svgGoogle.setAttribute('width', '100%');
        svgGoogle.setAttribute('height', '100%');
        svgGoogle.style.display = 'block';
        svgChartElement.replaceWith(svgGoogle);
        svgChartElement.style.display = 'block';
        googleChartElement.style.display = 'none';
      }
      else{
        svgChartElement.style.display = 'none';
        googleChartElement.style.display = 'block';
      }
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  })

  useEffect(() => {
    setContainerWidth(document.getElementById('chartComponentContainer').clientWidth);
    setContainerHeight(document.getElementById('chartComponentContainer').clientHeight);
  }, []);

  return (
    <div id='chartComponentContainer'>
      <div id='loadingChart' className={chartLoaded ? 'hidden' : 'shown'}>
        <img id='loadingSVG' src={LoadingSvg} alt='LoadingSVG' />
      </div>
      <div id='chartContentContainer' className={chartLoaded ? 'shown' : 'hidden'}>
        <h2 id='chartComponentTitle'>{title}</h2>
        <div id='chartComponentGoogleChartContainer'>
          <svg id='svgChart'></svg>
          <div id='chartComponentStandingsChart'/>
          <img id='teamLogo0' className='teamLogo' alt='teamLogo0'></img>
          <img id='teamLogo1' className='teamLogo' alt='teamLogo1'></img>
          <img id='teamLogo2' className='teamLogo' alt='teamLogo2'></img>
          <img id='teamLogo3' className='teamLogo' alt='teamLogo3'></img>
          <img id='teamLogo4' className='teamLogo' alt='teamLogo4'></img>
        </div>
      </div>
    </div>
  );
}

export default Chart;