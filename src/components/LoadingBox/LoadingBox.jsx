import { TRANSPARENT_IMAGE_URI } from "../../lib/constants.js";
import "./LoadingBox.css";

const LoadingBox = ({ image = TRANSPARENT_IMAGE_URI }) => {
  return (
    <div className="loading-box">
      <div>
        <img src={image} alt="Loading Box Image" />
      </div>
    </div>
  );
};

export default LoadingBox;
