import { IDEAL_TEAMS_PER_DIVISION, MLB_STANDINGS_WHITE, TRANSPARENT_IMAGE_URI } from "../../lib/constants.js";
import "./StandingsTable.css";

const missingData = [];
for (let i = 0; i < IDEAL_TEAMS_PER_DIVISION; i++) {
  missingData.push({
    gamesBack: "",
    roadRecord: "",
    rank: "",
    homeRecord: "",
    winPercentage: "",
    losses: "",
    lastTenRecord: "",
    streak: "",
    name: "",
    wins: "",
    logo: TRANSPARENT_IMAGE_URI,
    color: "transparent",
    code: i,
  });
}

const StandingsTable = ({ data = missingData }) => {
  return (
    <div className="standings-table">
      <div className="standings-table-padded">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th className="standings-table-team-name">Team</th>
              <th>W</th>
              <th>L</th>
              <th>PCT</th>
              <th>GB</th>
              <th>Streak</th>
              <th>Home</th>
              <th>Away</th>
              <th>L10</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.code}>
                <td>{row.rank}</td>
                <td>
                  <div className="standings-table-logo-text-cell">
                    <img
                      src={row.logo}
                      style={{
                        borderColor: row.color,
                        backgroundColor: row.color === "transparent" ? "transparent" : MLB_STANDINGS_WHITE,
                      }}
                    />
                    <span>{row.name}</span>
                  </div>
                </td>
                <td>{row.wins}</td>
                <td>{row.losses}</td>
                <td>{row.winPercentage}</td>
                <td>{row.gamesBack}</td>
                <td>{row.streak}</td>
                <td>{row.homeRecord}</td>
                <td>{row.roadRecord}</td>
                <td>{row.lastTenRecord}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;
