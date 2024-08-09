# mlbstandings

## Description

This project was created to graph the changes in MLB division standings throughout a season. A Python script using the Beautiful Soup library is used to gather the standings data from [baseball-reference.com](https://www.baseball-reference.com/). If a MLB season is underway the standings data for the current season will be updated on a daily basis. Google Cloud Functions is running the Python script and updating the new data in a Firebase Firestore Database. This project uses scraping [baseball-reference.com](https://www.baseball-reference.com/) with a Python script over a baseball API as a cheaper alternative. You can access this website at [johnprovazek.com/mlbstandings](https://www.johnprovazek.com/mlbstandings/).

Built using React, Python, Google Charts, Google Cloud Functions, and Google Firebase.

<a href="#">
  <div align="center">
    <img src="https://github.com/user-attachments/assets/7e5af3b8-1f8c-47e1-83ca-c41c41d1a603" width="830px">
  </div>
</a>

## Credits

[How to Use Google Charts in React](https://blog.shahednasser.com/how-to-use-google-charts-in-react/#:~:text=In%20order%20to%20load%20Google,ll%20set%20google%20to%20window.) is a helpful guide I followed to get started implementing the Google Charts library in this project.

[baseball-reference.com](https://www.baseball-reference.com/) is a baseball statistics website being used to gather baseball standings data.

## Bugs & Improvements
- Revisit [overlapping rectangles algorithm](https://mikekling.com/comparing-algorithms-for-dispersing-overlapping-rectangles/) to improve the overlapping team icons.
- Revisit adding routes to github pages using [this method](https://github.com/rafgraph/spa-github-pages).
- Fix issue with dashed line edges not coming to a continuous point.
- When two dashed lines overlap it doesn't look fluid due to Google Charts precedence for which lines draw over other lines. Adding in many redundant columns would be a way to fix this.
- Consider adding a current standings table.
- Consider adding historic data past 2013.
- Use a linter and a style guide.
