import { DATE_STRING_FORMAT } from "./constants.js";

// Handles converting epoch date to date string.
export const epochToDateString = (epoch) => {
  return new Date(epoch * 1000).toLocaleDateString("en-US", DATE_STRING_FORMAT);
};

// Handles finding XY coordinates to place logos on top of Google Chart.
export const getLogoCoords = (data) => {
  const logoCoords = [];
  for (let i = 1; i < data[0].length; i++) {
    for (let j = data.length - 1; j > 0; j--) {
      if (data[j][i] !== null) {
        logoCoords.push({
          x: j - 1,
          y: data[j][i],
        });
        break;
      }
    }
  }
  return logoCoords;
};

// Handles transforming Google Charts Line Chart data to show dashed lines for lines that overlap.
export const transformDataDashed = (data, segments) => {
  // Validating Input
  if (!data || data.length < 2) {
    return data;
  }
  if (segments < 1) {
    segments = 1;
  }
  // Adding header from original input data.
  const headerRow = data[0];
  const numDataColumns = headerRow.length;
  const dashData = [headerRow];
  // Looping through rows of original input data.
  for (let i = 1; i < data.length - 1; i++) {
    const currentRow = data[i];
    const nextRow = data[i + 1];
    dashData.push([...currentRow], [...currentRow]); // Adding original input data row twice to avoid dots in chart.
    const slopeMatchData = Array(numDataColumns).fill(null);
    const matchCount = {};
    // Checking between original input data rows for matching line paths (matching slopes starting at same point).
    for (let c = 0; c < numDataColumns; c++) {
      if (nextRow[c] !== undefined && nextRow[c] !== null) {
        const key = `${currentRow[c]}_${nextRow[c] - currentRow[c]}`;
        let index = 0;
        if (c !== 0) {
          if (key in matchCount) {
            matchCount[key]++;
          } else {
            matchCount[key] = 0;
          }
          index = matchCount[key];
        }
        slopeMatchData[c] = {
          start: currentRow[c],
          slope: nextRow[c] - currentRow[c],
          index: index,
        };
      } else {
        slopeMatchData[c] = null;
      }
    }
    // Including the match count in slope match data.
    for (let c = 0; c < numDataColumns; c++) {
      if (nextRow[c] !== undefined && nextRow[c] !== null) {
        const key = `${currentRow[c]}_${nextRow[c] - currentRow[c]}`;
        slopeMatchData[c].count = c === 0 ? 1 : matchCount[key] + 1;
      }
    }
    // Inserting segmented rows in between original data rows.
    for (let s = 1; s < segments; s++) {
      const segUnit = s / segments;
      const row1 = currentRow.map((val, c) => {
        const match = slopeMatchData[c];
        return match && s % match.count === match.index
          ? val + segUnit * match.slope
          : null;
      });
      const row2 = currentRow.map((val, c) => {
        const match = slopeMatchData[c];
        return match && (s + 1) % match.count === match.index
          ? val + segUnit * match.slope
          : null;
      });
      dashData.push(row1, row2);
    }
  }
  // Adding final input data row twice to avoid dots in chart.
  const lastRow = data[data.length - 1];
  dashData.push([...lastRow], [...lastRow]);
  return dashData;
};
