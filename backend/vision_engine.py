import cv2
import numpy as np
import time
from collections import deque
from ultralytics import YOLO

class VisionEngine:
    def __init__(self):
        # Load YOLOv8-Pose model (Nano version for speed)
        # It will automatically download 'yolov8n-pose.pt' on first use if not present.
        self.model = YOLO('yolov8n-pose.pt')
        
        # State
        self.reps = 0
        self.stage = "UP"
        self.last_rep_time = 0
        self.angle_buffer = deque(maxlen=5)
        self.current_exercise = "squat"
        self.feedback = ""
        
        # COCO Keypoint Indices:
        # 0: Nose
        # 5: L-Shoulder, 6: R-Shoulder
        # 7: L-Elbow, 8: R-Elbow
        # 9: L-Wrist, 10: R-Wrist
        # 11: L-Hip, 12: R-Hip
        # 13: L-Knee, 14: R-Knee
        # 15: L-Ankle, 16: R-Ankle
        
        self.EXERCISE_CONFIG = {
            "squat": {
                "name": "Squats",
                "landmarks": [11, 13, 15], # Left Side: Hip, Knee, Ankle
                "upAngle": 160,
                "downAngle": 100,
                "feedback": { 
                    "start": "Stand in frame (Side View)",
                    "up": "Go down...", 
                    "down": "Good depth! Up.",
                    "correction": "Too low! Careful."
                },
                "correctionThreshold": 70
            },
            "pushup": {
                "name": "Pushups",
                "landmarks": [5, 7, 9], # Left Side: Shoulder, Elbow, Wrist
                "upAngle": 160,
                "downAngle": 100,
                "feedback": { 
                    "start": "Plank position (Side View)",
                    "up": "Lower chest...", 
                    "down": "Push up!",
                    "correction": "Keep back straight!"
                },
                "correctionThreshold": 60
            },
            "curl": {
                "name": "Bicep Curls",
                "landmarks": [5, 7, 9], # Left Side: Shoulder, Elbow, Wrist
                "upAngle": 160,
                "downAngle": 60,
                "feedback": { 
                    "start": "Hold weights (Side View)",
                    "up": "Curl up...", 
                    "down": "Extend arm fully.",
                    "correction": "Full range of motion!"
                },
                "correctionThreshold": 30
            },
            "neck": {
                "name": "Neck Stretch",
                "landmarks": [0, 5, 11], # Nose, Left Shoulder, Left Hip (Approx)
                "upAngle": 160,
                "downAngle": 140,
                "feedback": { 
                    "start": "Stand straight, look forward",
                    "up": "Tilt head left...", 
                    "down": "Good stretch! Up.",
                    "correction": "Gentle! Don't force."
                },
                "correctionThreshold": 130
            }
        }

    def reset_state(self, exercise_name):
        self.current_exercise = exercise_name
        self.reps = 0
        self.stage = "UP"
        self.last_rep_time = 0
        self.angle_buffer.clear()
        self.feedback = self.EXERCISE_CONFIG[exercise_name]["feedback"]["start"]

    def calculate_angle(self, a, b, c):
        a = np.array(a) # First
        b = np.array(b) # Mid
        c = np.array(c) # End
        
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        
        if angle > 180.0:
            angle = 360-angle
            
        return angle

    def get_smoothed_angle(self, angle):
        self.angle_buffer.append(angle)
        return sum(self.angle_buffer) / len(self.angle_buffer)

    def process_frame(self, frame_bytes):
        # Decode image
        nparr = np.frombuffer(frame_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return None

        h, w, _ = image.shape

        # Process with YOLO
        # verbose=False to keep logs distinct
        results = self.model(image, verbose=False)
        
        response = {
            "landmarks": [],
            "reps": self.reps,
            "feedback": self.feedback,
            "angle": 0
        }

        # Check if any person is detected
        if results[0].keypoints is not None and results[0].keypoints.has_visible:
            # Get keypoints (x, y, conf)
            # data shape: [num_persons, 17, 3] usually. We take the first person.
            keypoints = results[0].keypoints.data[0].cpu().numpy() 
            
            # Format landmarks for frontend (Normalizing to 0-1 range to match MediaPipe behavior)
            # COCO has 17 keypoints. Frontend might expect specific size, but usually just iterates.
            # We will map standard COCO 17 to a list.
            landmarks_list = []
            for kp in keypoints:
                x_px, y_px, conf = kp
                # Normalize
                norm_x = x_px / w
                norm_y = y_px / h
                # Visibility essentially implies confidence here
                landmarks_list.append({"x": float(norm_x), "y": float(norm_y), "z": 0.0, "visibility": float(conf)})
            
            response["landmarks"] = landmarks_list

            # Logic
            config = self.EXERCISE_CONFIG[self.current_exercise]
            idxs = config["landmarks"]
            
            # Extract coordinates for angle calc (using pixels is fine for angles, or normalized)
            # Let's use pixels from 'keypoints' directly for accuracy
            p1 = keypoints[idxs[0]][:2]
            p2 = keypoints[idxs[1]][:2]
            p3 = keypoints[idxs[2]][:2]
            
            # Confidence check: optionally ensure these specific points are detected
            conf1 = keypoints[idxs[0]][2]
            conf2 = keypoints[idxs[1]][2]
            conf3 = keypoints[idxs[2]][2]
            
            min_conf = 0.5
            if conf1 > min_conf and conf2 > min_conf and conf3 > min_conf:
                # Calculate angle
                angle = self.calculate_angle(p1, p2, p3)
                smoothed_angle = self.get_smoothed_angle(angle)
                response["angle"] = round(smoothed_angle)
                
                # Rep Counting
                now = time.time() * 1000 # ms
                
                if smoothed_angle > config["upAngle"]:
                    self.stage = "UP"
                    self.feedback = config["feedback"]["up"]
                    
                if smoothed_angle < config["downAngle"] and self.stage == "UP":
                    if (now - self.last_rep_time) > 1000: # 1s debounce
                        self.stage = "DOWN"
                        self.feedback = config["feedback"]["down"]
                        self.reps += 1
                        self.last_rep_time = now
                
                if smoothed_angle < config["correctionThreshold"]:
                    self.feedback = config["feedback"]["correction"]
                    
            else:
                 # Low confidence on tracking points, maybe user turned around or obscured
                 pass # Keep previous state/feedback or warn

            response["reps"] = self.reps
            response["feedback"] = self.feedback

        return response
