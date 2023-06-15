import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import StarlinkVisualization from './components/StarlinkVisualization/StarlinkVisualization';
import SatelliteDistanceCalculate from './components/SatelliteDistanceCalculate/SatelliteDistanceCalculate';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/starlinkVisualization" element={<StarlinkVisualization />} />
        <Route path="/satelliteDistanceCalculation" element={<SatelliteDistanceCalculate/>}/>
      </Routes>
    </Router>
  );
}

export default App;
