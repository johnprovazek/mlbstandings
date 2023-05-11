# mlbstandings

## Description

This project was created to graph the changes in MLB division standings throughout a season. A Python script using the Beautiful Soup library is used to gather the standings data from [baseball-reference.com](https://www.baseball-reference.com/). If a MLB season is underway the standings data for the current season will be updated on a daily basis. Google Cloud Functions is running this Python script and updating the new data in a Firebase Firestore Database. I decided to use scraping [baseball-reference.com](https://www.baseball-reference.com/) with a Python script over a baseball API as a cheaper alternative. You can access this website at [johnprovazek.com/mlbstandings](https://www.johnprovazek.com/mlbstandings/).

Built using React, Python, Google Charts, Google Cloud Functions, and Google Firebase.

## Credits

[How to Use Google Charts in React](https://blog.shahednasser.com/how-to-use-google-charts-in-react/#:~:text=In%20order%20to%20load%20Google,ll%20set%20google%20to%20window.) is a guide I followed to implement Google Charts.

[baseball-reference.com](https://www.baseball-reference.com/) is being used to gather baseball standings data.

## Bugs & Improvements
- Develop an algorithm to improve the overlapping team icons.
- Fix dashed line edges not coming to a point.
- Fix scenario where two dashed lines overlapping are not overlapping correctly.
- Chart margins could be improved to prioritize equal sized margins as well as fitting content.
- Consider adding a current standings table.
- Consider adding historic data past 2013.
- Use a linter and a style guide.