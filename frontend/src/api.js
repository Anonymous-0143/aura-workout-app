const API_URL = "http://127.0.0.1:8000";

export const getRecommendation = async (profile) => {
    const headers = {
        "Content-Type": "application/json",
    };

    const response = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(profile),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch recommendation");
    }

    return response.json();
};

export const logWorkout = async (workoutData) => {
    const response = await fetch(`${API_URL}/workouts/log`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutData),
    });

    if (!response.ok) {
        throw new Error("Failed to log workout");
    }

    return response.json();
};

export const getWorkoutHistory = async () => {
    const response = await fetch(`${API_URL}/workouts/history`, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch history");
    }

    return response.json();
};
