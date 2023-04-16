# mlbstandings

## Description

This project was created to graph the changes in MLB division standings throughout a season. A Python script using the Beautiful Soup library is used to gather the standings data from [baseball-reference.com](https://www.baseball-reference.com/). If a MLB season is underway the standings data for the current season will be updated on a daily basis. Google Cloud Functions is running this Python script and updating the new data in a Firebase Firestore Database. I decided to use scraping [baseball-reference.com](https://www.baseball-reference.com/) with a Python script over a baseball API as a cheaper alternative. You can access this website at [johnprovazek.com/mlbstandings](https://www.johnprovazek.com/mlbstandings/).

Built using React, Python, Google Charts, Google Cloud Functions, and Google Firebase.

## Credits

[React Google Charts](https://www.react-google-charts.com/) is used and worked around to display the chart data.

[baseball-reference.com](https://www.baseball-reference.com/) is being used to gather baseball standings data.

## Bugs & Improvements
- Use your own implemention of google charts instead of react-google-charts
- Develop an algorithm to improve the overlapping team icons.
- Add an option to print the chart.
- Consider adding historic data past 2013? NL Central in 2012 had 6 teams and in 2004/5 the Expos and Anaheim Angels names changes. These will be the first issues that will need to be addressed if adding more historic data.
- Fix mobile issue where the axis values aren't showing up.
- Move base options for chart to JSON file once chart options are decided upon
- Add url paths for specific years and divisions
- Improve quality of React code / react-google-charts issues.
- Use a linter and a style guide.