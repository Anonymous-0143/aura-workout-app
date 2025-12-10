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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Weekly Plan</h1>
            <p className="text-gray-400 text-lg">Focus: <span className="text-white font-medium">{plan.user_goal}</span></p>
          </div>
          <div className="flex gap-4">
            <button
                onClick={() => navigate('/vision-coach')}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all transform font-bold tracking-wide"
            >
                <span>👁️</span> AI COACH
            </button>
            <button
                onClick={onReset}
                className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
            >
                Update Profile
            </button>
          </div>
        </div>

        <div className="glass-card p-8 mb-12 border-l-4 border-white/20 bg-white/5">
          <h2 className="text-xl font-semibold text-white mb-2">Coach's Insight</h2>
          <p className="text-gray-300 italic text-lg leading-relaxed">"{plan.advice}"</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plan.schedule.map((workout, index) => (
            <div 
                key={index} 
                onClick={() => handleCardClick(workout)}
                className="glass-card overflow-hidden hover:bg-white/10 transition-all duration-500 group flex flex-col cursor-pointer border border-white/5 hover:border-white/20"
            >
              <div className="relative h-56 overflow-hidden">
                 {workout.image_url ? (
                    <img src={workout.image_url} alt={workout.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                 ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white/20 text-6xl font-bold">
                        {workout.day[0]}
                    </div>
                 )}
                 <div className="absolute top-4 right-4">
                    <span className="text-xs bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-md font-medium border border-white/10">
                        {workout.duration_minutes} min
                    </span>
                 </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold text-white group-hover:text-gray-200 transition-colors">{workout.name}</h3>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{workout.day}</span>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${
                            workout.difficulty === 'Beginner' ? 'text-green-400 bg-green-400/10' :
                            workout.difficulty === 'Intermediate' ? 'text-yellow-400 bg-yellow-400/10' :
                            'text-red-400 bg-red-400/10'
                        }`}>
                            {workout.difficulty}
                        </span>
                    </div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/20 mb-8 flex-grow shadow-sm">
                    <p className="text-gray-900 text-sm leading-relaxed font-medium line-clamp-3">{workout.description}</p>
                </div>
                
                <button 
                    onClick={(e) => handleComplete(e, workout)}
                    className="w-full mt-auto bg-white/10 hover:bg-white text-white hover:text-black font-semibold py-3 px-4 rounded-xl transition-all duration-300 border border-white/10 hover:border-transparent"
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
