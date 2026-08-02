import React from "react";
import "./CircularProgress.scss";

const CircularProgress = ({ size = 40 }) => {
  return (
    <div
      className="loader"
      style={{ width: size, height: size }}
    ></div>
  );
};

export default CircularProgress;