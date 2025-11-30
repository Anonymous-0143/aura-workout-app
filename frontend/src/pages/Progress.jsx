import React, { useEffect, useState } from 'react';
import { getWorkoutHistory } from '../api';

const Progress = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getWorkoutHistory();
        setHistory(data);
      } catch (err) {
        setError("Failed to load history");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading progress...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const totalWorkouts = history.length;
  const totalMinutes = history.reduce((acc, curr) => acc + curr.duration_minutes, 0);

  return (
    <div className="min-h-screen p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Your Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="glass-card p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Workouts</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{totalWorkouts}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Minutes</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{totalMinutes}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
        
        {history.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-xl">
            <p className="text-gray-500">No workouts logged yet. Go to your dashboard and complete a workout!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.slice().reverse().map((log) => (
              <div key={log.id} className="glass-card p-6 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{log.workout_name}</h3>
                  <p className="text-sm text-gray-500">{log.date}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {log.duration_minutes} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
