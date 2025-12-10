import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { ArrowLeft, RefreshCw, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PoseLogic, EXERCISE_CONFIG } from '../utils/poseLogic';

const AuraVision = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  
  // Logic State
  const poseLogic = useRef(new PoseLogic());
  const cameraRef = useRef(null);
  const poseRef = useRef(null);

  // UI State
  const [isActive, setIsActive] = useState(false);
  const [reps, setReps] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [feedback, setFeedback] = useState("Stand in frame");
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs for loop
  const isActiveRef = useRef(false);
  
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Initialize MediaPipe Pose
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
    poseRef.current = pose;

    // Initialize Camera
    if (webcamRef.current && webcamRef.current.video) {
        const camera = new Camera(webcamRef.current.video, {
            onFrame: async () => {
                if (isActiveRef.current && poseRef.current) {
                    await poseRef.current.send({image: webcamRef.current.video});
                }
            },
            width: 640,
            height: 480
        });
        cameraRef.current = camera;
        camera.start();
        setIsLoaded(true);
    }

    return () => {
        if (cameraRef.current) cameraRef.current.stop();
        if (poseRef.current) poseRef.current.close();
    };
  }, []);

  // Handle Exercise Change
  useEffect(() => {
    const newState = poseLogic.current.resetState(selectedExercise);
    setReps(newState.reps);
    setFeedback(newState.feedback);
  }, [selectedExercise]);

  const onResults = useCallback((results) => {
    if (!canvasRef.current || !webcamRef.current || !webcamRef.current.video) return;

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    const ctx = canvasRef.current.getContext('2d');
    
    ctx.save();
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    
    // Draw Landmarks
    if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#FFFFFF', lineWidth: 4 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#3B82F6', lineWidth: 2 });
        
        // Process Logic
        const logicState = poseLogic.current.processLandmarks(results.poseLandmarks);
        if (logicState) {
            setReps(logicState.reps);
            setFeedback(logicState.feedback);
        }
    }
    ctx.restore();
  }, []);

  // Toggle Camera/Processing
  const toggleSession = () => {
    setIsActive(!isActive);
    if (!isActive) {
        // Reset reps on start
        const newState = poseLogic.current.resetState(selectedExercise);
        setReps(newState.reps);
        setFeedback(newState.feedback);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        
        {/* Exercise Selector Pills */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-full border border-white/10 overflow-x-auto max-w-[70vw] backdrop-blur-sm">
            {Object.keys(EXERCISE_CONFIG).map(key => (
                <button
                    key={key}
                    onClick={() => setSelectedExercise(key)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap tracking-wide ${
                        selectedExercise === key 
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {EXERCISE_CONFIG[key].name}
                </button>
            ))}
        </div>

        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        <div className="relative w-full max-w-4xl aspect-video bg-black/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/5">
            <Webcam
                ref={webcamRef}
                className="absolute top-0 left-0 w-full h-full object-cover opacity-80"
                mirrored={true}
                width={640}
                height={480}
                onUserMedia={() => {
                    // Re-initialize camera if needed or just set loaded
                    if (!cameraRef.current && webcamRef.current && webcamRef.current.video) {
                         const camera = new Camera(webcamRef.current.video, {
                            onFrame: async () => {
                                if (isActiveRef.current && poseRef.current) {
                                    await poseRef.current.send({image: webcamRef.current.video});
                                }
                            },
                            width: 640,
                            height: 480
                        });
                        cameraRef.current = camera;
                        camera.start();
                        setIsLoaded(true);
                    }
                }}
            />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
            />
            
            {/* Overlay UI */}
            <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Reps</p>
                <p className="text-5xl font-bold text-white tabular-nums">{reps}</p>
            </div>

             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 whitespace-nowrap shadow-xl">
                <p className="text-xl font-medium text-white tracking-wide">{feedback}</p>
            </div>
            
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white/70 font-medium">Loading Vision Engine...</p>
                    </div>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="mt-10 flex gap-6 items-center">
            <button 
                onClick={toggleSession}
                disabled={!isLoaded}
                className={`flex items-center gap-3 px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl ${
                    isActive 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                    : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                } ${!isLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isActive ? <><Pause className="w-6 h-6"/> STOP SESSION</> : <><Play className="w-6 h-6"/> START WORKOUT</>}
            </button>
            
             <button 
                onClick={() => {
                    const newState = poseLogic.current.resetState(selectedExercise);
                    setReps(newState.reps);
                    setFeedback(newState.feedback);
                }}
                className="p-5 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/20"
                title="Reset Reps"
            >
                <RefreshCw className="w-6 h-6"/>
            </button>
        </div>

        <p className="mt-8 text-gray-500 text-sm max-w-md text-center tracking-wide">
            Ensure your full body is visible. Currently tracking: <span className="text-white font-medium border-b border-white/20 pb-0.5">{EXERCISE_CONFIG[selectedExercise].name}</span>
        </p>

      </div>
    </div>
  );
};

export default AuraVision;
