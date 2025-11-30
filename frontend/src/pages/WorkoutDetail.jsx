import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logWorkout } from '../api';
import { v4 as uuidv4 } from 'uuid';

const WorkoutDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { workout } = location.state || {};

  const handleComplete = async () => {
    try {
        const logData = {
            id: uuidv4(),
            date: new Date().toISOString().split('T')[0],
            workout_name: workout.name,
            duration_minutes: workout.duration_minutes,
            notes: "Completed via Detail View"
        };
        await logWorkout(logData);
        alert(`Great job! You completed ${workout.name}.`);
        navigate('/');
    } catch (error) {
        console.error("Failed to log workout:", error);
        alert("Failed to log workout. Please try again.");
    }
  };

  if (!workout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Workout Not Found</h2>
          <p className="text-gray-600 mb-6">Please go back to the dashboard and select a workout.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gray-900">
        {workout.image_url ? (
          <img
            src={workout.image_url}
            alt={workout.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-80" />
        )}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto w-full p-6 md:p-10">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{workout.name}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                {workout.duration_minutes} Minutes
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                {workout.difficulty}
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                {workout.day}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
          <p className="text-gray-600 leading-relaxed text-lg">{workout.description}</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Exercises</h2>
        <div className="space-y-6">
          {workout.exercises && workout.exercises.length > 0 ? (
            workout.exercises.map((exercise, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex flex-col md:flex-row">
                  {/* Animation/Image */}
                  <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 relative">
                    {exercise.image_url ? (
                        <img 
                            src={exercise.image_url} 
                            alt={exercise.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Preview
                        </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="p-6 md:w-2/3 flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{exercise.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Sets</p>
                            <p className="text-lg font-bold text-gray-800">{exercise.sets}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Reps</p>
                            <p className="text-lg font-bold text-gray-800">{exercise.reps}</p>
                        </div>
                    </div>
                    {exercise.intensity && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Intensity</p>
                            <p className="text-md font-medium text-gray-700">{exercise.intensity}</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl">
                No detailed exercises available for this workout.
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center">
            <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all text-lg"
                onClick={handleComplete}
            >
                Complete Workout
            </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetail;
