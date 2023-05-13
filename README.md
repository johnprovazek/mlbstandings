# mlbstandings

## Description

This project was created to graph the changes in MLB division standings throughout a season. A Python script using the Beautiful Soup library is used to gather the standings data from [baseball-reference.com](https://www.baseball-reference.com/). If a MLB season is underway the standings data for the current season will be updated on a daily basis. Google Cloud Functions is running this Python script and updating the new data in a Firebase Firestore Database. I decided to use scraping [baseball-reference.com](https://www.baseball-reference.com/) with a Python script over a baseball API as a cheaper alternative. You can access this website at [johnprovazek.com/mlbstandings](https://www.johnprovazek.com/mlbstandings/).

Built using React, Python, Google Charts, Google Cloud Functions, and Google Firebase.

## Credits

[How to Use Google Charts in React](https://blog.shahednasser.com/how-to-use-google-charts-in-react/#:~:text=In%20order%20to%20load%20Google,ll%20set%20google%20to%20window.) is a guide I followed to implement Google Charts.

[baseball-reference.com](https://www.baseball-reference.com/) is being used to gather baseball standings data.

## Bugs & Improvements
- Implement an [algorithm](https://mikekling.com/comparing-algorithms-for-dispersing-overlapping-rectangles/) to improve the overlapping team icons.
- Add in routes to github pages using [this method](https://github.com/rafgraph/spa-github-pages) so you can direct link to a division and season.
- Fix issue with dashed line edges not coming to a continuous point.
- Dashed lines overlapping doesn't look fluid due to Google Charts drawing preferences. This looks to be a limitation of Google Charts that would be difficult to improve.
- Chart margins could be improved to prioritize equal sized margins as well as fitting content.
- Consider adding a current standings table.
- Consider adding historic data past 2013.
- Use a linter and a style guide.