import "./Footnote.css";

const Footnote = ({ children }) => {
  return <>{children !== "" && <h4 className="footnote">{children}</h4>}</>;
};

export default Footnote;
