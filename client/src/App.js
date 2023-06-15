import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import StarlinkVisualization from "./components/StarlinkVisualization/StarlinkVisualization";
import SatelliteDistanceCalculate from "./components/SatelliteDistanceCalculate/SatelliteDistanceCalculate";
import SatelliteNotInOrbit from "./components/SatelitteNotInOrbit/SatelliteNotInOrbit";
import DisplaySatelliteImage from "./components/DisplaySatelliteImage/DisplaySatelliteImage";
import IssLiveLocation from "./components/IssLiveLocation/IssLiveLocation";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/starlinkVisualization"
          element={<StarlinkVisualization />}
        />
        <Route
          path="/satelliteDistanceCalculation"
          element={<SatelliteDistanceCalculate />}
        />
        <Route
          path="/displaySatelliteImage"
          element={<DisplaySatelliteImage />}
        />
        <Route path="/issLiveLocation" element={<IssLiveLocation />} />

        <Route path="/satelliteNotInOrbit" element={<SatelliteNotInOrbit />} />
      </Routes>
    </Router>
  );
}

export default App;
