import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Progress from './pages/Progress';
import WorkoutDetail from './pages/WorkoutDetail';
import AuraVision from './components/AuraVision';
import { getRecommendation } from './api';

const Home = () => {
  const [plan, setPlan] = useState(() => {
    const savedPlan = localStorage.getItem('workoutPlan');
    return savedPlan ? JSON.parse(savedPlan) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOnboardingComplete = async (profile) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendation(profile);
      setPlan(data);
      localStorage.setItem('workoutPlan', JSON.stringify(data));
    } catch (err) {
      setError('Failed to get recommendations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    localStorage.removeItem('workoutPlan');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
       {/* Simple Navbar for demo */}
       <nav className="p-4 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50">
          <div className="font-bold text-xl gradient-text">FitAI</div>
          <div className="space-x-4">
              <a href="/" className="text-gray-600 hover:text-blue-600">Dashboard</a>
              <a href="/progress" className="text-gray-600 hover:text-blue-600">Progress</a>
          </div>
       </nav>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {!plan ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard plan={plan} onReset={handleReset} />
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/progress" element={<Progress />} />
        <Route path="/workout/:id" element={<WorkoutDetail />} />
        <Route path="/vision-coach" element={<AuraVision />} />
        <Route path="/" element={<Home />} />
      </Routes>
      <AIChat />
    </Router>
  );
}

export default App;
