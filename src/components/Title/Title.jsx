import GithubSVG from "../../assets/images/github.svg";
import "./Title.css";

const Title = () => {
  return (
    <h1 className="main-title">
      MLB Standings&nbsp;
      <a href="https://github.com/johnprovazek/mlbstandings">
        <img className="main-title-github-svg" src={GithubSVG} alt="Github SVG" />
      </a>
    </h1>
  );
};

export default Title;
