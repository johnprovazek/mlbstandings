# mlbstandings

## Description

This project was created to graph the changes in MLB division standings throughout a season. A Python script using the Beautiful Soup library is used to gather the standings data from [baseball-reference.com](https://www.baseball-reference.com/). If a MLB season is underway the standings data will be updated on a daily basis. Google Cloud Functions is running this Python script and updating the new data in Google Firebase Firestore. You can access this website at [johnprovazek.com/mlbstandings](https://www.johnprovazek.com/mlbstandings/).

Built using React, Google Charts, and Google Firebase Firestore. A Python script running in Google Cloud Functions is used to gather current standings data.

## Bugs & Improvements
- Improve React code.
- Add division ranking array to firestore data.
- Improve the overlapping team icons.
- Add dashed lines when teams overlap.
- Add more historic data.
- Use a linter and a style guide.