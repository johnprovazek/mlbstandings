import { useEffect, useState, useRef } from "react";
import useGoogleCharts from "../useGoogleCharts/useGoogleCharts.jsx";
import "./chart.css";

// Handles transforming Google Charts Line Chart data to show dashed lines for lines that overlap.
const transformData = (data) => {
  let itemCount = data[0].length;
  const dashData = [];
  dashData.push(data[0]);
  for (let i = 1; i < data.length - 1; i++) {
    // Adding data twice to avoid dots in chart.
    dashData.push(data[i]);
    dashData.push(data[i]);
    let fromTo = []; // 2D array of the Y values between two data points.
    let directions = Array(itemCount).fill(0); // Slope between two data points (1 or -1).
    let matches = []; // 2D array of matching groups with same slope between games.
    for (let j = 1; j < itemCount; j++) {
      let from = data[i][j];
      let to = data[i + 1][j];
      if (to !== null) {
        directions[j - 1] = from > to ? -1 : 1;
        // Bundles matching pairs in 2d array.
        let newPair = 1;
        for (let k = 0; k < fromTo.length && newPair; k++) {
          if (fromTo[k].toString() === [from, to].toString()) {
            for (let a = 0; a < matches.length && newPair; a++) {
              for (let b = 0; b < matches[a].length && newPair; b++) {
                if (matches[a][b] === k) {
                  matches[a].push(j - 1);
                  newPair = 0;
                }
              }
            }
            if (newPair) {
              matches.push([k, j - 1]);
            }
          }
        }
        fromTo.push([from, to]);
      }
    }
    // Setting up array to track active item in a matching group.
    let activeMatchesIndex = [];
    for (let j = 0; j < matches.length; j++) {
      activeMatchesIndex.push(0);
    }
    // Breaking down data into parts for dashed lines.
    let segments = 12;
    let dashSegments = Array(itemCount).fill(null);
    for (let j = 1; j < segments; j++) {
      let xAxisValue = i - 1 + j * (1 / segments);
      for (let k = 0; k < itemCount; k++) {
        if (directions[k] === 0) {
          dashSegments[k] = null;
        } else {
          dashSegments[k] = data[i][k + 1] + j * (1 / segments) * directions[k];
        }
      }
      let unitSegments = dashSegments.slice();
      for (let k = 0; k < matches.length; k++) {
        for (let a = 0; a < matches[k].length; a++) {
          if (a !== activeMatchesIndex[k]) {
            unitSegments[matches[k][a]] = null; // Only show one segment, rest null.
          }
        }
      }
      // Dashed lines need two points at same X axis.
      dashData.push([xAxisValue, unitSegments[0], unitSegments[1], unitSegments[2], unitSegments[3], unitSegments[4]]);
      unitSegments = dashSegments.slice();
      for (let k = 0; k < matches.length; k++) {
        activeMatchesIndex[k] = (activeMatchesIndex[k] + 1) % matches[k].length; // Shuffles index to get dashes.
        for (let a = 0; a < matches[k].length; a++) {
          if (a !== activeMatchesIndex[k]) {
            unitSegments[matches[k][a]] = null; // Only show one segment, rest null.
          }
        }
      }
      // Dashed lines need two points at same X axis.
      dashData.push([xAxisValue, unitSegments[0], unitSegments[1], unitSegments[2], unitSegments[3], unitSegments[4]]);
    }
  }
  // Adding the same data twice to avoid dots in the chart.
  dashData.push(data[data.length - 1]);
  dashData.push(data[data.length - 1]);
  return dashData;
};

const Chart = ({ chartSettings }) => {
  const [title, setTitle] = useState(""); // Title of chart.
  const [showChart, setShowChart] = useState(true); // Flag to display Google Chart or Image.

  const google = useGoogleCharts(); // Google Charts library.
  const wrapper = useRef(null); // Google Charts wrapper.
  const containerWidth = useRef(null); // Chart container width.
  const resizeTimeoutId = useRef(null); // Id used to keep track of resizing chart timeout.
  const logoCoords = useRef([]); // XY coordinates to place logos on top of Google Chart

  // Builds Google Charts line Chart and handles resize events.
  useEffect(() => {
    resizeTimeoutId.current = null;
    // Handles resizing Chart.
    const handleResize = () => {
      if (google && chartSettings && wrapper.current && containerWidth.current) {
        let chartWidth = document.getElementById("chart-component-container").clientWidth;
        if (Math.abs((containerWidth.current - chartWidth) / containerWidth.current) >= 0.15) {
          // Redraws Google Chart immediately. Container width has changed more than 15%.
          clearTimeout(resizeTimeoutId.current);
          drawChart(chartWidth);
        } else {
          // Redraws Google Chart after delay.
          setShowChart(false);
          clearTimeout(resizeTimeoutId.current);
          resizeTimeoutId.current = setTimeout(() => drawChart(chartWidth), 100);
        }
      }
    };

    // Handles drawing Google Chart
    const drawChart = (width) => {
      // Scaling line width and font sizes.
      let tOptions = wrapper.current.getOptions();
      let scaledLineWidth = tOptions["lineWidth"];
      if (chartSettings.scaledLineWidth && tOptions["hAxis"]["viewWindow"]["max"] != null) {
        let maxGames = tOptions["hAxis"]["viewWindow"]["max"];
        let lineScaleMultiplier = 1;
        if (width < 700) {
          lineScaleMultiplier = 0.002083 * width - 0.6;
        }
        scaledLineWidth = (0.000141026 * Math.pow(maxGames, 2) - 0.0488462 * maxGames + 6.72821) * lineScaleMultiplier;
      }
      let sFontSize = Math.min(width / 60, 16);
      tOptions = {
        ...tOptions,
        lineWidth: scaledLineWidth,
        hAxis: {
          ...tOptions.hAxis,
          textStyle: {
            ...tOptions.hAxis.textStyle,
            fontSize: sFontSize,
          },
          titleTextStyle: {
            ...tOptions.hAxis.titleTextStyle,
            fontSize: sFontSize,
          },
        },
        vAxis: {
          ...tOptions.vAxis,
          textStyle: {
            ...tOptions.vAxis.textStyle,
            fontSize: sFontSize,
          },
          titleTextStyle: {
            ...tOptions.vAxis.titleTextStyle,
            fontSize: sFontSize,
          },
        },
      };
      // Drawing Google Chart.
      wrapper.current.setOptions(tOptions);
      wrapper.current.draw();
      containerWidth.current = width;
    };
    // Sets up Google Chart.
    if (google && chartSettings && chartSettings.data.length) {
      // Deleting title from Google Charts options and uses custom title implementation.
      if (chartSettings.options["title"] !== null && typeof chartSettings.options["title"] !== "undefined") {
        setTitle(chartSettings.options["title"]);
      }
      // Setting custom title backgroundColor to chart backgroundColor.
      let chartTitle = document.getElementById("chart-component-title");
      if (
        chartSettings.options["backgroundColor"] !== null &&
        typeof chartSettings.options["backgroundColor"] !== "undefined"
      ) {
        chartTitle.style.backgroundColor = chartSettings.options["backgroundColor"];
      } else {
        chartTitle.style.backgroundColor = "transparent";
      }
      // Adding Custom Chart scaling settings.
      let tOptions = {
        ...chartSettings.options,
        title: null,
        chartArea: {
          ...chartSettings.options.chartArea,
          top: "2.5%",
          bottom: "13.6111111111%",
          left: "6.125%",
          right: "6.125%",
        },
        hAxis: {
          ...chartSettings.options.hAxis,
          textStyle: { bold: true },
          titleTextStyle: { bold: true, italic: false },
        },
        vAxis: {
          ...chartSettings.options.vAxis,
          textStyle: { bold: true },
          titleTextStyle: { bold: true, italic: false },
        },
      };
      // Finding XY coordinates to place logos on top of Google Chart.
      logoCoords.current = [];
      for (let i = 1; i < chartSettings.data[0].length; i++) {
        for (let j = chartSettings.data.length - 1; j > 0; j--) {
          if (chartSettings.data[j][i] !== null) {
            logoCoords.current.push({
              x: j - 1,
              y: chartSettings.data[j][i],
            });
            break;
          }
        }
      }
      // Transforming Google Charts Line Chart data if dashedLines option set.
      let tData = chartSettings.dashedLines ? transformData(chartSettings.data) : chartSettings.data;
      // Building Google Charts wrapper.
      wrapper.current = new google.visualization.ChartWrapper({
        containerId: "chart-component-standings-chart",
        chartType: "LineChart",
        dataTable: google.visualization.arrayToDataTable(tData),
        options: tOptions,
      });
      // Function called after Google Chart is "ready".
      google.visualization.events.addListener(wrapper.current, "ready", () => {
        // Adding team logos.
        let layout = wrapper.current.getChart().getChartLayoutInterface();
        let googleChartContainer = document.getElementById("chart-component-google-chart-container");
        for (let i = 0; i < logoCoords.current.length; i++) {
          let teamLogo = document.getElementById("chart-component-team-logo" + i);
          teamLogo.classList.remove("hidden");
          let logoLeft = Math.floor(layout.getXLocation(logoCoords.current[i]["x"]));
          let logoTop = Math.floor(layout.getYLocation(logoCoords.current[i]["y"])) - teamLogo.width / 2;
          teamLogo.style.left = (logoLeft / googleChartContainer.clientWidth) * 100 + "%";
          teamLogo.style.top = (logoTop / googleChartContainer.clientHeight) * 100 + "%";
          teamLogo.style.borderColor = tOptions["colors"][i];
          teamLogo.style.borderWidth = wrapper.current.getOptions().lineWidth + "px";
          teamLogo.style.borderRadius = wrapper.current.getOptions().lineWidth + "px";
          teamLogo.style.zIndex = logoCoords.current.length - i;
        }
        // Creating Image from Chart for resize events.
        let imageChartElement = document.getElementById("chart-component-standings-chart-image");
        imageChartElement.src = wrapper.current.getChart().getImageURI();
        // Showing Chart.
        setShowChart(true);
      });
      // Drawing Chart.
      let chartWidth = document.getElementById("chart-component-container").clientWidth;
      drawChart(chartWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [google, chartSettings]);

  return (
    <div id="chart-component-container">
      <h2 id="chart-component-title">{title}</h2>
      <div id="chart-component-google-chart-container">
        <div id="chart-component-standings-chart" style={{ visibility: showChart ? "visible" : "hidden" }}></div>
        <img id="chart-component-standings-chart-image" style={{ visibility: showChart ? "hidden" : "visible" }}></img>
        {chartSettings.logoPaths.map((logoPath, index) => (
          <img
            key={index}
            id={"chart-component-team-logo" + index}
            className="chart-component-team-logo hidden"
            src={logoPath}
            alt={"teamLogo" + index}
          ></img>
        ))}
      </div>
    </div>
  );
};

export default Chart;
