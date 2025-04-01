# mlbstandings

## Description

This project was created to graph the changes in MLB division standings throughout a season.
A Python script is used to gather the MLB division standings data utilizing the [statsapi.mlb.com](https://statsapi.mlb.com/docs/login) API.
When an MLB season is underway, the current season's standings will be updated on a daily basis.
Google Cloud Functions is running the Python script and updating the data in a Firebase Firestore database.
You can access this website at [johnprovazek.com/mlbstandings](https://www.johnprovazek.com/mlbstandings/).

Built using React, Vite, Python, Google Charts, Google Cloud Functions, and Firebase.

<div align="center">
  <picture>
    <img src="https://repository-images.githubusercontent.com/483421754/ce78b600-adcd-445a-80cc-8236060bc43e" width="830px">
  </picture>
</div>

## Credits

[How to Use Google Charts in React](https://blog.shahednasser.com/how-to-use-google-charts-in-react/) is a helpful guide I followed to get started implementing the Google Charts library in this project.

[statsapi.mlb.com](https://statsapi.mlb.com/docs/login) is the API used in this project to gather MLB division standings data.

## Bugs & Improvements

- Fix issue with dashed line edges not coming to a continuous point.
- When two dashed lines overlap it doesn't look fluid due to Google Charts precedence for which lines draw over other lines. Adding in many redundant columns would be a way to fix this.
- Investigate font differences on Safari.
- Consider adding historic data past 2013.
- Consider adding an indicator that a user can click on the chart to reveal the standings table.
- Consider adding a copy and paste chart image and/or download image feature.
