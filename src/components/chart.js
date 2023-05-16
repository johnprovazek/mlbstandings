import { useEffect } from 'react';
import { useState } from 'react';
import useGoogleCharts from './useGoogleCharts';
import './chart.css';

function Chart(props) {
  const [title, setTitle] = useState('')
  const [wrapper, setWrapper] = useState(null);
  const [logoCoordinates, setLogoCoordinates] = useState([])
  const [containerWidth, setContainerWidth] = useState(null)
  const [containerHeight, setContainerHeight] = useState(null)

  const google = useGoogleCharts();

  const processData = (data) => {
    // Get the team names and x and y coordinates of the last items and include ranking
    let coords = [null,null,null,null,null]
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
    setLogoCoordinates(coords)

    // Modify the table data to show dashed lines 
    if(props.chartParams.dashed){
      return addDashedData(data)
    }
    else{
      return data
    }
  }

  const addDashedData = (data) => {
    // Creating the new dashed table
    const d_t = []
    d_t.push(data[0])

    // Filling the table with extra data to add dashed lines.
    for (let i = 1; i < data.length - 1; i++) {
      d_t.push(data[i]) // Adding the same data twice to avoid dots in the chart
      d_t.push(data[i]) // Adding the same data twice to avoid dots in the chart
      let from_to = [] // 2D array of the win/loss records between two games for all five teams in a division
      let direction = [0,0,0,0,0] // Direction of the slope of the line between two games. 1 for win. -1 for loss. 0 if first game is last game played.
      let matches = [] // 2D array of the matching groups with same slope between games.
      for (let j = 1; j < 6; j++) {
        let from = data[i][j]
        let to = data[i+1][j]
        if(to !== null){ // Looking at the next team win/loss score, could be null
          direction[j-1] = (from > to) ? -1 : 1;
          // Bundles matching pairs in a 2d array.
          let new_pair = 1
          for (let k = 0; k < from_to.length && new_pair; k++) {
            if(from_to[k].toString() === [from,to].toString()){
              for (let a = 0; a < matches.length && new_pair; a++) {
                for (let b = 0; b < matches[a].length && new_pair; b++) {
                  if (matches[a][b] === k){ 
                    matches[a].push(j-1)
                    new_pair = 0
                  }
                }
              }
              if(new_pair){
                matches.push([k,j-1])
              }
            }
          }
          from_to.push([from,to]);
        }
      }

      // Sets up an array to track the active item in a matching group
      let active_matches_index = []
      for (let j = 0; j < matches.length; j++) {
        active_matches_index.push(0)
      }

      // Breaking down data into parts for dashed lines
      let segments = 12 // Seperating into 12 segments per line because 12 is the LCM of 1,2,3, and 4.
      let d_s = [null,null,null,null,null]
      for (let j = 1; j < segments; j++) { 
        let x_axis_value = (i-1) + (j*(1/segments))
        for (let k = 0; k < 5; k++) {
          if(direction[k] === 0){
            d_s[k] = null
          }
          else{
            d_s[k] =  data[i][k+1]+(j*(1/segments)*direction[k])
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
        d_t.push([x_axis_value,u_s[0],u_s[1],u_s[2],u_s[3],u_s[4]]) // this hack to get dashed lines needs two points at same x_axis
        u_s = d_s.slice()
        for (let k = 0; k < matches.length; k++) {
          active_matches_index[k] = (active_matches_index[k] + 1) % matches[k].length // shuffles the index to get the dashes
          for(let a = 0; a < matches[k].length; a++){
            if(a !== active_matches_index[k]){
              u_s[matches[k][a]] = null // only show one segment, rest null
            }
          }
        }
        d_t.push([x_axis_value,u_s[0],u_s[1],u_s[2],u_s[3],u_s[4]]) // this hack to get dashed lines needs two points at same x_axis
      }
    }
    d_t.push(data[data.length-1]) // Adding the same data twice to avoid dots in the chart
    d_t.push(data[data.length-1]) // Adding the same data twice to avoid dots in the chart
    return d_t
  }

  const processOptions = (options) => {
    let containerWidth = document.getElementById('chartComponentContainer').clientWidth

    // Deleting title from google charts options and using custom title implementation
    if(options['title'] !== null && typeof options['title'] !== 'undefined'){
      setTitle(options['title'])
      options['title'] = null
    }
    // Sets title backgroundColor to chart backgroundColor if one exists
    if(options['backgroundColor'] !== null && typeof options['backgroundColor'] !== 'undefined'){
      document.getElementById('chartComponentTitle').style.backgroundColor = options['backgroundColor'];
    }
    else{
      document.getElementById('chartComponentTitle').style.backgroundColor = 'white';
    }
    // Resizing the title at specific widths
    if (containerWidth >= 720){
      document.getElementById('chartComponentTitle').style.fontSize = '24px';
    }
    else if (containerWidth >= 500 && containerWidth <= 719){
      document.getElementById('chartComponentTitle').style.fontSize = '18px';
    }
    else if (containerWidth <= 499) {
      document.getElementById('chartComponentTitle').style.fontSize = '12px';
    }
    // Modify the chartArea values
    if(props.chartParams.scaledChartArea){
      let scaledChartArea = options.chartArea
      if (containerWidth >= 720){
        scaledChartArea = {
          ...scaledChartArea,
          top: '2.5%',
          bottom: '13.6111111111%',
          left: '6.125%',
          right: '6.125%'
        }
      }
      else if (containerWidth >= 500 && containerWidth <= 719){
        scaledChartArea = {
          ...scaledChartArea,
          top: '2.5%',
          bottom: '13.6111111111%',
          left: '8%',
          right: '4.25%'
        }
      }
      else if (containerWidth <= 499) {
        scaledChartArea = {
          ...scaledChartArea,
          top: '2.5%',
          bottom: '22.05%',
          left: '17.3000827815%',
          right: '9.1875%'
        }
      }
      options['chartArea'] = scaledChartArea
    }
    // Modify the lineWidth
    if(props.chartParams.scaledLineWidth){
      let max_haxis = options['hAxis']['viewWindow']['max']  // TODO: check this value is not null
      let chartWidth = document.getElementById('chartComponentStandingsChart').clientWidth
      let lineScaleMultiplier = 1
      if(chartWidth < 769){ // TODO: reevaluate this number later
        lineScaleMultiplier = 0.0020833333333333333 * (chartWidth) - 0.6
      }
      let scaledLineWidth = (0.000141026 * Math.pow(max_haxis, 2) - 0.0488462*(max_haxis) + 6.728210) * lineScaleMultiplier
      options['lineWidth'] = scaledLineWidth
    }
    return options
  }

  useEffect(() => {
    if (google && props.chartParams && props.chartParams.data.length) {
      // Turning off display of Logos
      const logoElements = document.getElementsByClassName('teamLogo');
      for (let i = 0; i < logoElements.length; i++) {
        logoElements[i].style.display = 'none';
      }
      const pData = processData(props.chartParams.data)
      const pOptions = processOptions(props.chartParams.options)
      const newWrapper = new google.visualization.ChartWrapper({
        containerId: 'chartComponentStandingsChart',
        chartType: 'LineChart',
        dataTable: google.visualization.arrayToDataTable(pData),
        options: pOptions,
      });
      setWrapper(newWrapper)
    }
  }, [google, props.chartParams]);

  const addTeamLogos = () => {
    let layout = wrapper.getChart().getChartLayoutInterface();
    let chartWidth = layout.getChartAreaBoundingBox()['width'] // chart width
    let logoWidth = 40
    if (chartWidth < 677){
      logoWidth = chartWidth/16.925
    }

    // Fill in new dictionary with x and y coordinates from the google chart
    var l_c = [] // new logo coordinates
    for (let i = 0; i < logoCoordinates.length; i++) {
      l_c.push({
        'team' : logoCoordinates[i]['team'],
        'ranking' : logoCoordinates[i]['ranking'],
        'x' : Math.floor(layout.getXLocation(logoCoordinates[i]['x'])),
        'y' : Math.floor(layout.getYLocation(logoCoordinates[i]['y'])),
      });
    }

    // Add in Team Logos to the end of the chart
    let containerWidth = document.getElementById('chartComponentGoogleChartContainer').clientWidth
    let containerHeight = document.getElementById('chartComponentGoogleChartContainer').clientHeight
    for (let i = 0; i < l_c.length; i++) {
      var teamLogo = document.getElementById('teamLogo' + i);
      teamLogo.style.display = 'block';
      teamLogo.src=props.chartParams.logos[logoCoordinates[i]['team'] + '.svg']
      teamLogo.width = logoWidth;
      teamLogo.height = logoWidth;
      let logoLeft = l_c[i]['x']
      let logoTop = l_c[i]['y'] - logoWidth/2
      teamLogo.style.left = (logoLeft/containerWidth) * 100 + '%'
      teamLogo.style.top = (logoTop/containerHeight) * 100 + '%';
      teamLogo.style.borderColor = props.chartParams.options['colors'][i];
      teamLogo.style.borderWidth = wrapper.getOptions().lineWidth + 'px'
      teamLogo.style.borderRadius = wrapper.getOptions().lineWidth + 'px'
      teamLogo.style.zIndex = Math.abs(l_c[i]['ranking'] - (l_c.length - 1));
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
      let chartContainerElement = document.getElementById('chartComponentContainer')
      let curContainerWidth = 0;
      let curContainerHeight = 0;
      if (chartContainerElement !== null) {
        curContainerWidth = chartContainerElement.clientWidth
        curContainerHeight = chartContainerElement.clientHeight
      }
      if(wrapper && google && props.chartParams && containerWidth && containerHeight && curContainerWidth && curContainerHeight){ // TODO: maybe all these are uncessary
        // If the container width or height has changed by more than 15% trigger a redrawn chart
        if(Math.abs((containerWidth - curContainerWidth)/containerWidth) >= 0.15 || 
            Math.abs((containerHeight - curContainerHeight)/containerHeight) >= 0.15){
          clearTimeout(timeoutId);
          redraw(curContainerWidth,curContainerHeight)
        }
        else{
          toggleSvg(true) // temporarily show svg
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => redraw(curContainerWidth,curContainerHeight), 100);
        }
      }
    }

    const redraw = (width, height) => {
      toggleSvg(false) // remove svg
      const pOptions = processOptions(props.chartParams.options)
      wrapper.setOptions(pOptions)
      wrapper.draw();
      setContainerWidth(width)
      setContainerHeight(height)
    }

    const toggleSvg = (option) => {
      if(option){
        var svgChartElement = document.getElementById('svgChart');
        var svgGoogle = document.getElementById('chartComponentStandingsChart').getElementsByTagName('div')[0].getElementsByTagName('div')[0].getElementsByTagName('div')[0].getElementsByTagName('svg')[0].cloneNode(true);
        svgGoogle.id = 'svgChart'
        let width = svgGoogle.width['animVal']['value']
        let height = svgGoogle.height['animVal']['value']
        let viewboxString = '0 0 ' + width + ' ' + height
        svgGoogle.setAttribute('viewBox', viewboxString);
        svgGoogle.setAttribute('width', '100%');
        svgGoogle.setAttribute('height', '100%')
        svgGoogle.style.display = 'block'
        svgChartElement.replaceWith(svgGoogle);
        let googleChartElement = document.getElementById('chartComponentStandingsChart')
        svgChartElement.style.display = 'block';
        googleChartElement.style.display = 'none';
      }
      else{
        var svgChartElement = document.getElementById('svgChart');
        svgChartElement.style.display = 'none'
        let googleChartElement = document.getElementById('chartComponentStandingsChart')
        googleChartElement.style.display = 'block';
      }

    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  })

  useEffect(() => {
    setContainerWidth(document.getElementById('chartComponentContainer').clientWidth)
    setContainerHeight(document.getElementById('chartComponentContainer').clientHeight)
  }, []);

  return (
    <div id='chartComponentContainer'>
      <h2 id='chartComponentTitle'>{title}</h2>
      <div id='chartComponentGoogleChartContainer'>
        <svg id='svgChart'></svg>
        <img id='chartImage'></img>
        <div id='chartComponentStandingsChart'/>
        <img id='teamLogo0' className='teamLogo' alt='teamLogo0'></img>
        <img id='teamLogo1' className='teamLogo' alt='teamLogo1'></img>
        <img id='teamLogo2' className='teamLogo' alt='teamLogo2'></img>
        <img id='teamLogo3' className='teamLogo' alt='teamLogo3'></img>
        <img id='teamLogo4' className='teamLogo' alt='teamLogo4'></img>
      </div>
    </div>
  )
}

export default Chart;


// top: '2.5%',
// bottom: '22.05%',
// left: '17.3000827815%',
// right: '9.1875%'

    // Overlap algorithm
    // let min_x = l_c.reduce((min, p) => p.x < min ? p.x : min, l_c[0].x)
    // let min_y = l_c.reduce((min, p) => p.y < min ? p.y : min, l_c[0].y)
    // let max_x = l_c.reduce((max, p) => p.x > max ? p.x : max, l_c[0].x)
    // let max_y = l_c.reduce((max, p) => p.y > max ? p.y : max, l_c[0].y)
    // let bb_c_x = (max_x + min_x) / 2 
    // let bb_c_y = (max_y + min_y) / 2
    // let m_u = 5
    // let c_u = 0.25
    // let overlaps = true
    // while(overlaps){
    //   overlaps = false
    //   let overlap_vectors = []
    //   for (let i = 0; i < l_c.length; i++) {
    //     let v = {'x' : 0, 'y': 0}
    //     for (let j = 0; j < l_c.length; j++) {
    //       let x_d = l_c[i]['x'] - l_c[j]['x'];
    //       let y_d = l_c[i]['y'] - l_c[j]['y'];
    //       if(i != j && Math.abs(x_d) < logoWidth && Math.abs(y_d) < logoWidth){
    //         v = {
    //           'x': v['x'] + (x_d < 0 ? -m_u : m_u),
    //           'y': v['y'] + (y_d < 0 ? -m_u : m_u)
    //         }
    //       }
    //     }
    //     if(v['x'] != 0 && v['y'] != 0){
    //       overlaps = true
    //       let bb_x_d = l_c[i]['x'] - bb_c_x;
    //       let bb_y_d = l_c[i]['y'] - bb_c_y;
    //       v = {
    //         'x': v['x'] + (bb_x_d < 0 ? -c_u : c_u),
    //         'y': v['y'] + (bb_y_d < 0 ? -c_u : c_u)
    //       }
    //     }
    //     overlap_vectors.push(v)
    //   }
    //   if(overlaps){
    //     for (let i = 0; i < l_c.length; i++) {
    //       l_c[i]['x'] = l_c[i]['x'] + overlap_vectors[i]['x']
    //       l_c[i]['y'] = l_c[i]['y'] + overlap_vectors[i]['y']
    //     }
    //   }
    // }