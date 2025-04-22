import { useEffect, useState, useRef, useMemo } from "react";
import LoadingBox from "../../components/LoadingBox/LoadingBox.jsx";
import useGoogleCharts from "../../hooks/useGoogleCharts.js";
import { transformDataDashed, getLogoCoords } from "../../lib/utils.js";
import {
  TRANSPARENT_IMAGE_URI,
  CHART_RESIZE_PERCENT,
  LINE_WIDTH_DEFAULT,
  MLB_STANDINGS_BLACK,
  SEGMENTS,
} from "../../lib/constants.js";
import "./Chart.css";

// Handles scaling chart line width based on container width and max hAxis units.
// Quadratic equation based on the points (180, 0.8), (70, 1), and (10, 1.2).
const getLineWidth = (scale, defaultWidth, chartOptions, containerWidth) => {
  let lineWidth = chartOptions?.lineWidth ?? defaultWidth;
  if (scale && chartOptions?.hAxis?.viewWindow?.max) {
    const hMax = chartOptions.hAxis.viewWindow.max;
    const baseWidth = containerWidth * 0.00444444;
    const quadratic = 8.9126559714795e-6 * hMax * hMax - 0.0040463458110517 * hMax + 1.2395721925134;
    lineWidth = quadratic * baseWidth;
  }
  return lineWidth;
};

// Handles overriding chart options.
const overrideChartOptions = (chartOptions, lineWidth, fontSize) => {
  return {
    ...chartOptions,
    lineWidth: lineWidth,
    title: null,
    legend: "none",
    chartArea: {
      ...chartOptions.chartArea,
      top: "2.5%",
      bottom: "13.6111111111%",
      left: "6.125%",
      right: "6.125%",
    },
    hAxis: {
      ...chartOptions.hAxis,
      textStyle: {
        ...chartOptions.hAxis?.textStyle,
        fontSize: fontSize,
      },
      titleTextStyle: {
        ...chartOptions.hAxis?.titleTextStyle,
        fontSize: fontSize,
      },
    },
    vAxis: {
      ...chartOptions.vAxis,
      textStyle: {
        ...chartOptions.vAxis?.textStyle,
        fontSize: fontSize,
      },
      titleTextStyle: {
        ...chartOptions.vAxis?.titleTextStyle,
        fontSize: fontSize,
      },
    },
  };
};

const Chart = ({
  scaledLineWidth = false, // Flag to enable/disable scaling of the line width.
  dashed = false, // Flag to display data with dashed lines.
  data = null, // Chart data used by Google Charts.
  options = null, // Chart options used by Google Charts.
  logoPaths = [], // List of image paths for team logos, ordered to match data.
  noDataImage = TRANSPARENT_IMAGE_URI, // Image shown when there is no data.
}) => {
  const [showChart, setShowChart] = useState(true); // Flag to display Google Chart or image.
  const [logoSettings, setLogoSettings] = useState(null); // Team logo placement settings.
  const [chartImage, setChartImage] = useState(TRANSPARENT_IMAGE_URI); // Google Charts Image URI.
  const google = useGoogleCharts(); // Google Charts library.
  const wrapper = useRef(null); // Google Charts wrapper.
  const resizeTimeoutID = useRef(null); // ID used to keep track of resizing chart timeout.
  const containerWidth = useRef(null); // Chart container width.
  const chartComponentRef = useRef(null);
  const googleChartContainerRef = useRef(null);
  const googleChartRef = useRef(null);

  // Memoize logo coordinates to avoid recalculations on every render.
  const memoizedLogoCoords = useMemo(() => {
    return data ? getLogoCoords(data) : [];
  }, [data]);

  // Memoize dashed data transformation to avoid recalculations on every render.
  const memoizedDashedData = useMemo(() => {
    return data ? transformDataDashed(data, SEGMENTS) : [];
  }, [data]);

  useEffect(() => {
    resizeTimeoutID.current = null;
    let googleChartReadyListener = null;

    // Draws Google Chart applying custom options.
    const drawChart = () => {
      if (!wrapper.current || !chartComponentRef.current) {
        return;
      }
      const width = chartComponentRef.current.getBoundingClientRect().width;
      const chartOptions = wrapper.current.getOptions();
      const lineWidth = getLineWidth(scaledLineWidth, LINE_WIDTH_DEFAULT, chartOptions, width);
      wrapper.current.setOptions(overrideChartOptions(chartOptions, lineWidth, width / 60));
      wrapper.current.draw();
      containerWidth.current = width;
    };

    // Handles redrawing Google Chart.
    const handleResize = () => {
      if (data && containerWidth.current && chartComponentRef.current) {
        const currentWidth = chartComponentRef.current.getBoundingClientRect().width;
        const widthChange = Math.abs((containerWidth.current - currentWidth) / containerWidth.current);
        if (widthChange >= CHART_RESIZE_PERCENT) {
          clearTimeout(resizeTimeoutID.current);
          drawChart();
        } else {
          setShowChart(false);
          clearTimeout(resizeTimeoutID.current);
          resizeTimeoutID.current = setTimeout(drawChart, 150);
        }
      }
    };

    if (google && data && googleChartRef.current) {
      wrapper.current = new google.visualization.ChartWrapper({
        container: googleChartRef.current,
        chartType: "LineChart",
        dataTable: google.visualization.arrayToDataTable(dashed ? memoizedDashedData : data),
        options: options,
      });
      googleChartReadyListener = google.visualization.events.addListener(wrapper.current, "ready", () => {
        const layout = wrapper.current.getChart().getChartLayoutInterface();
        const chartContainerBox = googleChartContainerRef.current.getBoundingClientRect();
        const chartOptions = wrapper.current.getOptions();
        const newLogoSettings = memoizedLogoCoords.map((coord, i) => ({
          left: `${(Math.floor(layout.getXLocation(coord.x)) / chartContainerBox.width) * 100}%`,
          top: `${(Math.floor(layout.getYLocation(coord.y)) / chartContainerBox.height) * 100}%`,
          borderColor: chartOptions.colors?.[i] ?? MLB_STANDINGS_BLACK,
          zIndex: memoizedLogoCoords.length - i,
        }));
        setLogoSettings(newLogoSettings);
        setChartImage(wrapper.current.getChart().getImageURI());
        setShowChart(true);
      });
      drawChart();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (googleChartReadyListener) {
        google.visualization.events.removeListener(googleChartReadyListener);
      }
    };
  }, [google, scaledLineWidth, dashed, data, options, memoizedLogoCoords, memoizedDashedData]);

  if (!data) {
    return <LoadingBox image={noDataImage} />;
  }

  return (
    <div className="chart-component" ref={chartComponentRef}>
      <h2 className="chart-title" style={{ backgroundColor: options?.backgroundColor ?? "transparent" }}>
        {options?.title ?? ""}
      </h2>
      <div className="google-chart-container" ref={googleChartContainerRef}>
        <div
          className="google-chart"
          ref={googleChartRef}
          style={{ visibility: showChart ? "visible" : "hidden" }}
        ></div>
        <img className="google-chart" src={chartImage} style={{ visibility: showChart ? "hidden" : "visible" }}></img>
        {logoSettings &&
          logoPaths.map((logoPath, index) => (
            <img
              key={index}
              className="team-logo"
              src={logoPath ?? TRANSPARENT_IMAGE_URI}
              alt={"Team Logo " + index}
              style={{
                left: logoSettings[index].left,
                top: logoSettings[index].top,
                borderColor: logoSettings[index].borderColor,
                zIndex: logoSettings[index].zIndex,
              }}
            ></img>
          ))}
      </div>
    </div>
  );
};

// check logoSettings and logoPaths are same length

export default Chart;
