import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { ArrowLeft, RefreshCw, Play, Pause, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EXERCISE_CONFIG = {
  squat: {
    name: "Squats",
    landmarks: [23, 25, 27], // Hip, Knee, Ankle
    upAngle: 160,
    downAngle: 90,
    feedback: { 
        start: "Stand in frame",
        up: "Go down...", 
        down: "Good depth! Up.",
        correction: "Too low! Careful."
    },
    correctionThreshold: 70
  },
  pushup: {
    name: "Pushups",
    landmarks: [11, 13, 15], // Shoulder, Elbow, Wrist
    upAngle: 160,
    downAngle: 90,
    feedback: { 
        start: "Get into plank position",
        up: "Lower chest...", 
        down: "Push up!",
        correction: "Keep back straight!"
    },
    correctionThreshold: 60
  },
  curl: {
    name: "Bicep Curls",
    landmarks: [11, 13, 15], // Shoulder, Elbow, Wrist
    upAngle: 160,
    downAngle: 45,
    feedback: { 
        start: "Hold weights, stand straight",
        up: "Curl up...", 
        down: "Extend arm fully.",
        correction: "Full range of motion!"
    },
    correctionThreshold: 30
  }
};

const AuraVision = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [reps, setReps] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [feedback, setFeedback] = useState(EXERCISE_CONFIG['squat'].feedback.start);
  const [stage, setStage] = useState("UP"); 
  const [cameraLoaded, setCameraLoaded] = useState(false);

  // Calculate angle between three points
  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const onResults = (results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasCtx = canvasRef.current.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                     { color: '#00FF00', lineWidth: 4 });
      drawLandmarks(canvasCtx, results.poseLandmarks,
                    { color: '#FF0000', lineWidth: 2 });

      const landmarks = results.poseLandmarks;
      const config = EXERCISE_CONFIG[selectedExercise];
      
      // Get landmarks based on config
      const p1 = landmarks[config.landmarks[0]];
      const p2 = landmarks[config.landmarks[1]];
      const p3 = landmarks[config.landmarks[2]];

      if (p1 && p2 && p3) {
        const angle = calculateAngle(p1, p2, p3);
        
        // Visual feedback for angle
        canvasCtx.font = "30px Arial";
        canvasCtx.fillStyle = "white";
        canvasCtx.fillText(Math.round(angle).toString(), p2.x * videoWidth, p2.y * videoHeight);

        // Rep Counting Logic
        if (angle > config.upAngle) {
          setStage("UP");
          setFeedback(config.feedback.up);
        }
        if (angle < config.downAngle && stage === "UP") {
          setStage("DOWN");
          setFeedback(config.feedback.down);
          setReps(prev => prev + 1);
        }
        
        // Form Correction
        if (angle < config.correctionThreshold) {
             setFeedback(config.feedback.correction);
        }
      }
    } else {
        setFeedback("Body not detected");
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    const pose = new Pose({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }});

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    let camera = null;
    if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (isActive && webcamRef.current?.video) {
             await pose.send({image: webcamRef.current.video});
          }
        },
        width: 640,
        height: 480
      });
      camera.start();
      setCameraLoaded(true);
    }

    return () => {
        if (camera) {
            camera.stop();
        }
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
            const tracks = webcamRef.current.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, [isActive, selectedExercise]); // Re-run when exercise changes to update callback closure if needed, though mostly for isActive

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-full">
            <ArrowLeft className="w-6 h-6" />
        </button>
        
        {/* Exercise Selector Pills */}
        <div className="flex gap-2 bg-gray-900/50 p-1 rounded-full border border-gray-800">
            {Object.keys(EXERCISE_CONFIG).map(key => (
                <button
                    key={key}
                    onClick={() => {
                        setSelectedExercise(key);
                        setReps(0);
                        setFeedback(EXERCISE_CONFIG[key].feedback.start);
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedExercise === key 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    {EXERCISE_CONFIG[key].name}
                </button>
            ))}
        </div>

        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        
        <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
            <Webcam
                ref={webcamRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
                mirrored={true}
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
            />
            
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <p className="text-sm text-gray-300">Reps</p>
                <p className="text-3xl font-bold text-blue-400">{reps}</p>
            </div>

             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 whitespace-nowrap">
                <p className="text-lg font-medium text-white">{feedback}</p>
            </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex gap-6">
            <button 
                onClick={() => {
                    setIsActive(!isActive);
                    if(!isActive) setReps(0);
                }}
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                    isActive 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                }`}
            >
                {isActive ? <><Pause className="w-6 h-6"/> Stop Session</> : <><Play className="w-6 h-6"/> Start Workout</>}
            </button>
            
             <button 
                onClick={() => setReps(0)}
                className="p-4 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
                <RefreshCw className="w-6 h-6"/>
            </button>
        </div>

        <p className="mt-6 text-gray-500 text-sm max-w-md text-center">
            Ensure your full body is visible. Currently tracking: <span className="text-gray-300">{EXERCISE_CONFIG[selectedExercise].name}</span>
        </p>

      </div>
    </div>
  );
};

export default AuraVision;
