import React, { useState } from 'react';

const Onboarding = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    fitness_level: 'Beginner',
    goal: 'Weight Loss',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      ...formData,
      age: parseInt(formData.age),
      weight: parseFloat(formData.weight),
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="glass-card p-10 w-full max-w-xl animate-fade-in-up border border-white/10 bg-black/40">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Welcome to AURA</h1>
          <p className="text-gray-400 text-lg">Let's build your perfect workout plan.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="e.g. 25"
                className="input-field bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-white/30 focus:ring-0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                placeholder="e.g. 70"
                className="input-field bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-white/30 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Fitness Level</label>
            <div className="grid grid-cols-3 gap-3">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, fitness_level: level })}
                  className={`py-3 px-4 rounded-xl border transition-all duration-300 font-medium ${
                    formData.fitness_level === level
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                      : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Primary Goal</label>
            <div className="relative">
                <select
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="input-field appearance-none bg-white/5 border-white/10 text-white focus:border-white/30 focus:ring-0 cursor-pointer"
                >
                <option value="Weight Loss" className="bg-gray-900 text-white">Weight Loss</option>
                <option value="Muscle Gain" className="bg-gray-900 text-white">Muscle Gain</option>
                <option value="Endurance" className="bg-gray-900 text-white">Endurance</option>
                <option value="Flexibility" className="bg-gray-900 text-white">Flexibility</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full text-lg py-4 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Generate My Plan
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
