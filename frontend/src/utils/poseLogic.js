import { POSE_LANDMARKS } from '@mediapipe/pose';

export const EXERCISE_CONFIG = {
    squat: {
        name: "Squats",
        landmarksLeft: [23, 25, 27], // Left: Hip, Knee, Ankle
        landmarksRight: [24, 26, 28], // Right: Hip, Knee, Ankle
        upAngle: 150, // Relaxed from 160
        downAngle: 100,
        feedback: {
            start: "Stand in frame (Side View)",
            up: "Go down...",
            down: "Good depth! Up.",
            correction: "Too low! Careful."
        },
        correctionThreshold: 70
    },
    pushup: {
        name: "Pushups",
        landmarksLeft: [11, 13, 15], // Left: Shoulder, Elbow, Wrist
        landmarksRight: [12, 14, 16], // Right: Shoulder, Elbow, Wrist
        upAngle: 160,
        downAngle: 90, // Adjusted for better range
        feedback: {
            start: "Plank position (Side View)",
            up: "Lower chest...",
            down: "Push up!",
            correction: "Keep back straight!"
        },
        correctionThreshold: 60
    },
    curl: {
        name: "Bicep Curls",
        landmarksLeft: [11, 13, 15], // Left
        landmarksRight: [12, 14, 16], // Right
        upAngle: 150, // Relaxed
        downAngle: 60,
        feedback: {
            start: "Hold weights (Side View)",
            up: "Curl up...",
            down: "Extend arm fully.",
            correction: "Full range of motion!"
        },
        correctionThreshold: 30
    },
    neck: {
        name: "Neck Stretch",
        landmarksLeft: [0, 11, 23], // Nose, L.Shoulder, L.Hip
        landmarksRight: [0, 12, 24], // Nose, R.Shoulder, R.Hip
        upAngle: 160,
        downAngle: 140,
        feedback: {
            start: "Stand straight, look forward",
            up: "Tilt head...",
            down: "Good stretch! Up.",
            correction: "Gentle! Don't force."
        },
        correctionThreshold: 130
    }
};

export class PoseLogic {
    constructor() {
        this.reps = 0;
        this.stage = "UP";
        this.lastRepTime = 0;
        this.angleBuffer = [];
        this.currentExercise = "squat";
        this.feedback = "";
        this.bufferSize = 5;
    }

    resetState(exerciseName) {
        this.currentExercise = exerciseName;
        this.reps = 0;
        this.stage = "UP";
        this.lastRepTime = 0;
        this.angleBuffer = [];
        this.feedback = EXERCISE_CONFIG[exerciseName].feedback.start;
        return { reps: 0, feedback: this.feedback };
    }

    calculateAngle(a, b, c) {
        // a, b, c are objects {x, y, z, visibility}
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);

        if (angle > 180.0) {
            angle = 360 - angle;
        }

        return angle;
    }

    getSmoothedAngle(angle) {
        this.angleBuffer.push(angle);
        if (this.angleBuffer.length > this.bufferSize) {
            this.angleBuffer.shift();
        }
        const sum = this.angleBuffer.reduce((a, b) => a + b, 0);
        return sum / this.angleBuffer.length;
    }

    processLandmarks(landmarks) {
        if (!landmarks) return null;

        const config = EXERCISE_CONFIG[this.currentExercise];

        const idxsLeft = config.landmarksLeft;
        const idxsRight = config.landmarksRight;

        // Get coordinates & visibility
        const p1_L = landmarks[idxsLeft[0]];
        const p2_L = landmarks[idxsLeft[1]];
        const p3_L = landmarks[idxsLeft[2]];

        const p1_R = landmarks[idxsRight[0]];
        const p2_R = landmarks[idxsRight[1]];
        const p3_R = landmarks[idxsRight[2]];

        const visLeft = (p1_L.visibility + p2_L.visibility + p3_L.visibility) / 3;
        const visRight = (p1_R.visibility + p2_R.visibility + p3_R.visibility) / 3;

        let p1, p2, p3;
        let side = "LEFT";

        // Logic to choose best side
        if (visRight > visLeft) {
            p1 = p1_R; p2 = p2_R; p3 = p3_R;
            side = "RIGHT";
        } else {
            p1 = p1_L; p2 = p2_L; p3 = p3_L;
            side = "LEFT";
        }

        // Ensure landmarks are visible enough
        if (Math.max(visLeft, visRight) < 0.5) {
            return { reps: this.reps, feedback: "Adjust position", angle: 0 };
        }

        // Calculate angle
        const angle = this.calculateAngle(p1, p2, p3);
        const smoothedAngle = this.getSmoothedAngle(angle);

        // Rep Counting Logic
        const now = Date.now();

        if (smoothedAngle > config.upAngle) {
            this.stage = "UP";
            this.feedback = config.feedback.up;
        }

        if (smoothedAngle < config.downAngle && this.stage === "UP") {
            if ((now - this.lastRepTime) > 1000) { // 1s debounce
                this.stage = "DOWN";
                this.feedback = config.feedback.down;
                this.reps += 1;
                this.lastRepTime = now;
            }
        }

        if (smoothedAngle < config.correctionThreshold) {
            this.feedback = config.feedback.correction;
        }

        return {
            reps: this.reps,
            feedback: this.feedback,
            angle: Math.round(smoothedAngle),
            side: side
        };
    }
}
