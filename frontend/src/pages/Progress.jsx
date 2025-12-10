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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
    </div>
  );
  
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const totalWorkouts = history.length;
  const totalMinutes = history.reduce((acc, curr) => acc + curr.duration_minutes, 0);

  return (
    <div className="min-h-screen p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-10 tracking-tight">Your Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card p-8 border-l-4 border-green-500 bg-white/5">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest">Total Workouts</h3>
            <p className="text-6xl font-bold text-white mt-4 tabular-nums">{totalWorkouts}</p>
          </div>
          <div className="glass-card p-8 border-l-4 border-blue-500 bg-white/5">
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest">Total Minutes</h3>
            <p className="text-6xl font-bold text-white mt-4 tabular-nums">{totalMinutes}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">Recent Activity</h2>
        
        {history.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-gray-400 text-lg">No workouts logged yet. Go to your dashboard and complete a workout!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.slice().reverse().map((log) => (
              <div key={log.id} className="glass-card p-6 flex justify-between items-center hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/20 group">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{log.workout_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{log.date}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10">
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
