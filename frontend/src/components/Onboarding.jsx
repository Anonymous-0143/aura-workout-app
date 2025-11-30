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
      <div className="glass-card p-8 w-full max-w-lg animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome to FitAI</h1>
          <p className="text-gray-600">Let's build your perfect workout plan.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="e.g. 25"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                placeholder="e.g. 70"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, fitness_level: level })}
                  className={`py-2 px-4 rounded-xl border transition-all duration-200 ${
                    formData.fitness_level === level
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className="input-field appearance-none"
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="Endurance">Endurance</option>
              <option value="Flexibility">Flexibility</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary w-full text-lg"
          >
            Generate My Plan
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
