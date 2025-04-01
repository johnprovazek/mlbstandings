import "./Dropdowns.css";

const Dropdowns = ({ seasons, season, handleSeasonChange, divisions, division, handleDivisionChange }) => {
  // Handles season dropdown select.
  const handleSeasonSelect = (event) => {
    handleSeasonChange(event.target.value);
    event.target.blur();
  };

  // Handles season dropdown select.
  const handleDivisionSelect = (event) => {
    handleDivisionChange(event.target.value);
    event.target.blur();
  };

  return (
    <div className="dropdown-container">
      <div className="season-container">
        <h2 className="dropdown-title">Season:</h2>
        <select className="dropdown-select" value={season} onChange={(e) => handleSeasonSelect(e)}>
          {seasons.map((seasonItem) => (
            <option key={seasonItem} value={seasonItem}>
              {seasonItem}
            </option>
          ))}
        </select>
      </div>
      <div className="division-container">
        <h2 className="dropdown-title">Division:</h2>
        <select className="dropdown-select" value={division} onChange={(e) => handleDivisionSelect(e)}>
          {divisions.map((divisionItem) => (
            <option key={divisionItem} value={divisionItem}>
              {divisionItem}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Dropdowns;
