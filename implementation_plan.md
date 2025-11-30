# Implementation Plan - Enhance Exercise Details and Animations

The goal is to provide more detailed exercise information (sets, reps, intensity) and add exercise animations (GIFs/images) to the workout recommendations. The user specifically requested a separate page for detailed workout views.

## Proposed Changes

### Backend

#### [MODIFY] [models.py](file:///d:/CODING/Workout/backend/models.py)
- Update `Exercise` model to include `image_url` (Optional[str]).
- Update `Workout` model to include `id` (str) so it can be referenced in the URL.

#### [MODIFY] [recommender.py](file:///d:/CODING/Workout/backend/recommender.py)
- Add a dictionary mapping common exercise keywords (e.g., "Squat", "Pushup", "Lunge", "Row", "Press") to public GIF URLs or placeholder images.
- Update `_generate_plan_from_program` to:
    - Generate a unique UUID for each `Workout`.
    - Populate `Exercise.image_url` based on the exercise name using the mapping.

### Frontend

#### [MODIFY] [App.jsx](file:///d:/CODING/Workout/frontend/src/App.jsx)
- Add a new route: `<Route path="/workout/:id" element={<WorkoutDetail />} />`.

#### [NEW] [WorkoutDetail.jsx](file:///d:/CODING/Workout/frontend/src/pages/WorkoutDetail.jsx)
- Create a new page component to display:
    - Workout Name & Description
    - List of Exercises with:
        - Name
        - Sets x Reps
        - Intensity
        - Large Animation/Image
    - "Complete Workout" button.
- Needs to retrieve the workout details. Since we don't have a persistent backend for individual workout retrieval by ID (it's generated on the fly), we might need to pass the state via navigation or store the current plan in a context/local storage. **Decision**: Use `useLocation` state to pass the workout object, or look it up from the `AuthContext` if the plan is stored there. For simplicity, passing via state is easiest, but if the user refreshes, data is lost. Better: Store current plan in `localStorage` or `AuthContext` and find by ID.

#### [MODIFY] [Dashboard.jsx](file:///d:/CODING/Workout/frontend/src/components/Dashboard.jsx)
- Update the workout card to link to `/workout/${workout.id}`.
- Remove the inline "Complete Workout" button if it's moved to the detail page (or keep both).

## Verification Plan

### Automated Tests
- Run `backend/test_recommender.py` to verify `Workout` has `id` and `Exercise` has `image_url`.

### Manual Verification
- Start backend and frontend.
- Click on a workout in the Dashboard.
- Verify it navigates to the new page.
- Verify detailed exercises and animations are shown.
