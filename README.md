# Computer Graphics - WebGL Basketball Court

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## Complete Instructions
**All detailed instructions, requirements, and specifications can be found in:**
`basketball_exercise_instructions.html`

## Group Members
- Itay Bar Or 808711

## Technical Details
- Run the server with: `node index.js`
- Access at http://localhost:8000 in your web browser

## Implemented
- All required controls

## Physics System
- The physics system in this basketball simulation is implemented manually without external libraries. It models ball motion using basic Newtonian mechanics, applying gravity, velocity updates, and collisions. The ball can bounce off the ground with reduced energy and friction, and spins while in the air based on shot direction. A custom AABB–sphere collision system handles realistic rebounds off the backboard by reflecting velocity and correcting position. Scoring is detected when the ball falls through the hoop’s region. All movement and interactions are handled through custom vector math for precision and control.
