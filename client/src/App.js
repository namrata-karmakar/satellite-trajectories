import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import StarlinkVisualization from './components/StarlinkVisualization/StarlinkVisualization';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/starlinkVisualization" element={<StarlinkVisualization />} />
      </Routes>
    </Router>
  );
}

export default App;
