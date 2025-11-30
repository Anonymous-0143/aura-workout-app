import React from 'react';
import { logWorkout } from '../api';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ plan, onReset }) => {
  const navigate = useNavigate();

  const handleComplete = async (e, workout) => {
    e.stopPropagation(); // Prevent navigation when clicking complete
    try {
      const logData = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        workout_name: workout.name,
        duration_minutes: workout.duration_minutes,
        notes: "Completed via Dashboard"
      };
      await logWorkout(logData);
      alert(`Great job! You completed ${workout.name}.`);
    } catch (error) {
      console.error("Failed to log workout:", error);
      alert("Failed to log workout. Please try again.");
    }
  };

  const handleCardClick = (workout) => {
      navigate(`/workout/${workout.id || 'unknown'}`, { state: { workout } });
  };

  return (
    <div className="min-h-screen p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Weekly Plan</h1>
            <p className="text-gray-600">Goal: <span className="font-semibold text-blue-600">{plan.user_goal}</span></p>
          </div>
          <div className="flex gap-4">
            <button
                onClick={() => navigate('/vision-coach')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all transform font-semibold"
            >
                <span>👁️</span> Start AI Coach
            </button>
            <button
                onClick={onReset}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100"
            >
                Update Profile
            </button>
          </div>
        </div>

        <div className="glass-card p-8 mb-10 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Coach's Insight</h2>
          <p className="text-gray-600 italic text-lg">"{plan.advice}"</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plan.schedule.map((workout, index) => (
            <div 
                key={index} 
                onClick={() => handleCardClick(workout)}
                className="glass-card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                 {workout.image_url ? (
                    <img src={workout.image_url} alt={workout.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-white text-4xl font-bold">
                        {workout.day[0]}
                    </div>
                 )}
                 <div className="absolute top-2 right-2">
                    <span className="text-xs bg-white/90 text-gray-800 px-2 py-1 rounded-full backdrop-blur-sm font-bold shadow-sm">
                        {workout.duration_minutes} min
                    </span>
                 </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{workout.name}</h3>
                        <span className="text-sm font-semibold text-gray-500">{workout.day}</span>
                    </div>
                  
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                    workout.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                    workout.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {workout.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">{workout.description}</p>
                
                <button 
                    onClick={(e) => handleComplete(e, workout)}
                    className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95 transform duration-150"
                >
                    Complete Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
