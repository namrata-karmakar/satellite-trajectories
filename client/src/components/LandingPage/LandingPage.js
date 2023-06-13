import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <h1 className="landing-page-title">Welcome to Satellite Network Visualization</h1>
      <p className="landing-page-text">Choose a use case:</p>
      <ul className="landing-page-use-cases">
        <li>
          <Link to="/usecase1" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F6F0;</span>
              <span className="link-text">Use Case 1</span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/usecase2" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F680;</span>
              <span className="link-text">Use Case 2</span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/usecase3" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F30E;</span>
              <span className="link-text">Use Case 3</span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/usecase4" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F4E6;</span>
              <span className="link-text">Use Case 4</span>
            </div>
          </Link>
        </li>
        <li>
          <Link to="/usecase5" className="landing-page-link">
            <div className="link-container">
              <span className="link-icon">&#x1F4BB;</span>
              <span className="link-text">Use Case 5</span>
            </div>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default LandingPage;
