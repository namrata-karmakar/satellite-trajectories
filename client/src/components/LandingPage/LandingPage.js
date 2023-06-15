import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <h1 className="landing-page-title">
        Welcome to Satellite Network Visualization & Analysis Platform
      </h1>
      <p className="landing-page-text">Choose a use case:</p>
      <ul className="landing-page-use-cases">
        <li>
          <Link to="/starlinkVisualization" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F6F0;</span>
              <span className="link-text">
                Use Case 1: Starlink Visualization - Namrata
              </span>
            </div>
          </Link>
        </li>
        <li>
          <Link
            to="/satelliteDistanceCalculation"
            className="landing-page-link"
          >
            <div className="link-container">
              <span className="link-icon">&#x1F680;</span>
              <span className="link-text">
                Use Case 2: Satellite Distance Calculation
              </span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/displaySatelliteImage" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F4E6;</span>
              <span className="link-text">
                Use Case 3: Display satellite images on UI
              </span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/issLiveLocation" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F4BB;</span>
              <span className="link-text">
                Use Case 4: Show ISS Live Location and historical locations
                track
              </span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/satelliteNotInOrbit" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F30E;</span>
              <span className="link-text">
                Use Case 5: Satellite Not In Orbit - Tanmay
              </span>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default LandingPage;
