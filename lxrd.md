# Orienteering: Digital AR Scavenger Hunt
## Learning Experience Design Document (lxrd)

---

## 1. Overview of the Learning Scenario

### Title of the XR Application
**Orienteering: Digital AR Scavenger Hunt**

### Brief Description of the Scenario
Orienteering: Digital AR Scavenger Hunt is a location-based, augmented reality (AR) web application designed for use in physical education (PE) classes. The scenario places students into the role of field operatives participating in a GPS-guided outdoor mission. Students are organized into small teams and given a join code by their teacher. Each team navigates to a series of real-world GPS checkpoints placed across the school grounds or a local outdoor area. Upon physically arriving at each checkpoint, the student's device unlocks an AI-generated task — either physical, cognitive, social, or creative in nature — that the team must complete together. Once the task is completed, the team submits their response, earns a score, and receives directions to the next checkpoint. An optional Augmented Reality view overlays a directional arrow and real-time distance information on the live camera feed, pointing students toward their next destination.

The teacher manages the session from a dashboard: drawing checkpoint locations on an interactive map, launching the session, distributing a QR code and join code to students, and monitoring all teams' live progress in real time. At the end of the session, an AI-generated debrief report summarizes team performance, engagement levels, highlights, and recommendations for the next session.

### Relevance of the Content
Physical education increasingly faces the challenge of engaging digital-native students who are accustomed to interactive technology. Traditional orienteering and outdoor navigation activities, while educationally valuable, often struggle to capture the interest of students who spend significant portions of their lives with smartphones and interactive media. This application bridges the gap between outdoor physical activity and digital engagement by embedding technology meaningfully into the physical world rather than replacing the outdoor experience. The scenario is relevant because it:

- Reinforces GPS navigation and spatial awareness skills with real-world practice.
- Integrates cross-curricular learning by embedding cognitive, social, and creative tasks into a PE context.
- Develops teamwork, communication, and problem-solving under physically active conditions.
- Uses AI to personalize task difficulty based on each team's observed performance, keeping all learners appropriately challenged.
- Leverages augmented reality to add a layer of digital meaning to the physical environment students are already moving through.

---

## 2. Target Group

### Description of the Learners
The primary target group is **secondary school students aged 12–17**, typically in Years 7 through 12 in European school systems, or Grades 6–11 in the North American system. These learners are enrolled in physical education courses and participate in outdoor education as part of their regular curriculum. They are expected to work in small teams of two to five students, allowing for collaborative dynamics that reflect both sport and cooperative learning principles.

Students in this age range are considered **digital natives** (Prensky, 2001) — they have grown up with smartphones, tablets, and interactive digital media as intrinsic parts of their lives. They are generally comfortable operating mobile devices but may have varying levels of experience with AR technology specifically, as consumer AR applications (such as Pokémon GO or Snapchat filters) are well known but educationally purposeful AR is less common in their experience.

### Specific Needs and Characteristics

**Technology experience:** The application is designed to require no prior technical knowledge. Students join by scanning a QR code or entering a short join code — actions that are immediately familiar from everyday digital life. No installation is required; the app runs entirely in the mobile browser.

**Inclusion:** The task system is designed to be genuinely inclusive. The four task types — Physical, Cognitive, Social, and Creative — ensure that no single student archetype dominates. A student who struggles with physical tasks may excel at a creative or cognitive challenge, and vice versa. Team structures further distribute responsibility, meaning no individual student is singled out or left behind.

**Adaptive difficulty:** The AI-powered task generation system monitors each team's average completion time and automatically adjusts difficulty upward or downward. Teams completing tasks very quickly are given harder challenges; teams taking longer are given easier tasks. This real-time adaptation supports students across a wide ability range within the same session.

**Language:** All generated content is in English by default, though the underlying AI model is capable of generating content in other languages if the teacher configures the session name accordingly.

---

## 3. Learning Objectives

### Cognitive Objectives — What should learners know?
- Students will understand the principles of GPS-based navigation, including how coordinates, distance, and direction translate to real-world movement.
- Students will develop awareness of how augmented reality overlays digital information onto physical environments, building foundational digital literacy.
- Students will be able to interpret spatial information (bearing, distance, map markers) and apply it to navigate an outdoor course.
- Students will understand how performance data (scores, time, hints used) reflects decision-making quality and effort.

### Behavioral Objectives — What should learners be able to do?
- Students will physically navigate between GPS-marked checkpoints using both a digital map view and an AR directional overlay.
- Students will complete a variety of task types under time-constrained, physically active conditions, demonstrating adaptability.
- Students will collaborate within teams to divide roles, share information, and agree on responses to open-ended tasks.
- Students will request, evaluate, and act on AI-generated hints to overcome challenges rather than giving up, practicing help-seeking behavior.
- Students will submit mission reports describing what their team did, developing the ability to articulate physical and cognitive activity in written form.

### Affective Objectives — What should learners experience or develop?
- Students will develop a sense of **agency and autonomy** as they navigate independently without constant teacher direction.
- Students will experience **belonging and team identity** through the squad-based structure and visible leaderboard, fostering healthy competition and camaraderie.
- Students will encounter the **satisfaction of physical accomplishment** — reaching a checkpoint after sustained navigation provides intrinsic reward that purely digital learning cannot replicate.
- Students will develop **resilience** through the hint system, which encourages persistence rather than surrender when tasks are difficult.
- Students will build positive associations with outdoor physical activity by embedding personally relevant technology into the experience, potentially shifting attitudes toward PE participation.

---

## 4. Description of the Learning Scenario

### The Environment
The learning scenario takes place in an **outdoor real-world environment** — a school sports field, campus grounds, local park, or any open outdoor area that the teacher has access to. The teacher visits the site beforehand and uses the web-based Teacher Dashboard to place four or more GPS checkpoints on an interactive map, assigning each checkpoint a task type (Physical, Cognitive, Social, or Creative) and a difficulty level (Easy, Medium, Hard).

On the day of the session, students gather outdoors with their smartphones. The teacher projects or shares the QR code and join code. Students scan the code, enter their squad name, and are immediately placed into the active mission on their mobile browser. No installation is required.

The atmosphere is intentionally designed with a cyberpunk aesthetic — dark backgrounds, neon-colored accents, and mission-oriented language ("operative," "waypoint," "objective") — to create a sense of adventure and urgency that motivates sustained engagement. The visual language is consistent with game-like environments that students in this age group are already familiar with, lowering the psychological barrier to participation.

```
┌────────────────────────────────────────────────────────────┐
│                  STUDENT MOBILE SCREEN                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Team Phoenix          [Scores]     Waypoint 2/4     │  │
│  │──────────────────────────────────────────────────────│  │
│  │                                                      │  │
│  │         [Interactive Map — CartoDB Voyager]          │  │
│  │         • Checkpoint markers visible on map          │  │
│  │         • User GPS dot (current position)            │  │
│  │         • Unlock radius circle around target         │  │
│  │                                                      │  │
│  │──────────────────────────────────────────────────────│  │
│  │  [Physical] (PHY)              Distance: 47 m        │  │
│  │  Brain Teaser Station                                │  │
│  │  Move within 20m to unlock                          │  │
│  │                                                      │  │
│  │  [AR View]              [Get Closer]                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

Figure 1: Student MAP phase — showing the navigation map,
distance to current checkpoint, and AR View / Unlock buttons.
```

### Interaction Design
Users interact with the application exclusively through **touch-based inputs** on their mobile browser. All interactive elements are sized for large touch targets (minimum 48px height) to account for use while moving. Key interactions include:

- **Navigating to a checkpoint** — students move physically through the environment; the map and AR view update in real time via GPS.
- **Opening the AR view** — tapping the "AR View" button activates the rear camera with a directional arrow overlay pointing toward the next checkpoint.
- **Unlocking an objective** — when within 20 metres of the checkpoint, students tap "Unlock Objective" to receive an AI-generated task.
- **Requesting hints** — up to three hints per task are available, each reducing the potential score by 15 points (minimum score: 40).
- **Submitting the task** — students write optional mission notes and tap "Submit and Score" to record completion.
- **Viewing standings** — a "Scores" button in the navigation header opens a live leaderboard showing all squads' scores and progress.

### Structure of the Learning Experience
The session follows a clear sequential structure:

1. **JOIN** — Students enter their squad name and mission code to join the session.
2. **MAP / NAVIGATE** — Students use the GPS map and optional AR view to navigate toward the current checkpoint.
3. **TASK** — Upon arrival, an AI-generated task is presented. Students complete it, optionally requesting hints.
4. **SUBMIT** — Students submit their response and receive a score (40–100 points based on hints used).
5. **ADVANCE** — Students advance to the next checkpoint and repeat steps 2–4.
6. **FINISHED** — Upon completing all checkpoints, students see their total score and can view the full team standings.

The teacher simultaneously monitors all teams on the Session Monitor dashboard, which auto-refreshes every 10 seconds and can generate a full AI debrief report at any time.

### Subject Matter
The subject matter spans multiple domains simultaneously. The **physical domain** includes cardiovascular endurance, spatial orientation, and team movement coordination. The **cognitive domain** includes map reading, GPS interpretation, problem-solving, and analytical thinking. The **social domain** includes collaborative decision-making and communication under pressure. The **creative domain** includes open-ended challenges that invite imagination and self-expression.

---

## 5. Role of XR

### Why is AR Used in This Scenario?
Augmented Reality is used in this scenario because it directly enhances the **spatial navigation experience** without separating the learner from the physical environment. Unlike Virtual Reality, which immerses the user in a fully artificial world, AR adds digital information to the real world the student is already moving through. This is the most pedagogically appropriate XR modality for outdoor physical education because:

1. **Safety** — Students must remain aware of their real surroundings while moving outdoors. AR keeps the physical environment fully visible; VR would remove it entirely.
2. **Embodied engagement** — The AR directional arrow responds to the student's actual physical orientation (compass heading) and GPS position. This creates a direct feedback loop between body movement and digital information, a core principle of embodied cognition.
3. **Motivational enhancement** — The AR camera view transforms a mundane "walk toward the dot on the map" into a visually engaging, mission-like experience more closely resembling games the students already enjoy.
4. **Contextual anchoring** — When the student points their phone toward the landscape and sees a neon arrow directing them, the digital objective becomes spatially anchored to the real world. This supports situated learning by embedding the learning cue directly into the context of the task.

---

## 6. Learning Processes and Theoretical Foundation

### Cognitive Processes Involved
Several interrelated cognitive processes are engaged throughout the scenario:

- **Attention** — The AR arrow, distance indicator, and neon visual design are calibrated to maintain attentional focus without causing overload. The clean, minimal overlay ensures students direct attention to navigation rather than interface complexity.
- **Spatial perception and wayfinding** — Students continuously process GPS data, map representations, and AR directional cues, building spatial mental models.
- **Working memory** — Holding the task instructions in mind while physically navigating requires active working memory management.
- **Metacognition** — The hint system and scoring system prompt students to reflect on their own knowledge and decide strategically whether to use hints.

### Cognitive Load Theory (Sweller, 1988)
Sweller's Cognitive Load Theory distinguishes between intrinsic load (complexity of the material), extraneous load (unnecessary complexity from poor design), and germane load (cognitive effort that contributes to learning). This application is designed to minimize extraneous load through several deliberate decisions:

- **Progressive disclosure** — Students only see the information relevant to their current phase. The task screen shows only the task; the map screen shows only navigation information.
- **Large, readable typography** — All critical information uses the Orbitron typeface at high contrast against dark backgrounds, reducing the visual parsing effort required while outdoors in varying light conditions.
- **Single primary action per screen** — Each phase presents one dominant button (Unlock, Submit, Next Waypoint), preventing decision paralysis and keeping working memory available for the learning content rather than interface navigation.

The AI-adaptive difficulty system also directly manages intrinsic load: if a team is consistently completing tasks too quickly (below 120 seconds average), difficulty is raised; if they are consistently struggling (above 360 seconds average), it is lowered. This mirrors the concept of the Zone of Proximal Development (Vygotsky, 1978), keeping learners challenged at the edge of their current capability rather than below or above it.

### Situated Learning Theory (Lave & Wenger, 1991)
Lave and Wenger's situated learning theory argues that learning is most effective when it occurs within authentic contexts that reflect the conditions in which the knowledge will actually be used. In this scenario, navigation skills are learned while literally navigating. Teamwork is practiced within a real team under real time pressure. Physical exertion is built into the learning structure rather than separated from it. The AR overlay further anchors learning cues to the physical landscape, making the digital information genuinely part of the real-world context rather than an abstract representation of it.

This stands in contrast to classroom-based orienteering lessons where students might study map reading on paper — a decontextualized activity that Lave and Wenger would predict to produce less transferable knowledge.

### References
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science, 12*(2), 257–285.
- Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.
- Lave, J., & Wenger, E. (1991). *Situated learning: Legitimate peripheral participation*. Cambridge University Press.
- Prensky, M. (2001). Digital natives, digital immigrants. *On the Horizon, 9*(5), 1–6.

---

## 7. Technology and Implementation

### Choice of XR Type: Augmented Reality
As justified in Section 5, **Augmented Reality** is the appropriate XR modality for this scenario. Mixed Reality (MR), which implies a deeper integration of real and virtual objects, was considered but requires dedicated hardware (e.g., Microsoft HoloLens) that is not feasible for school deployment. Virtual Reality was ruled out on safety grounds for outdoor use. Browser-based AR using the WebXR Device API and device sensors was selected as the most accessible implementation, requiring no app installation.

### Tools, Platforms, and Hardware

| Component | Technology |
|---|---|
| Frontend framework | React 18 with Vite |
| Styling | Tailwind CSS v3 with custom cyberpunk design tokens |
| Maps | Leaflet.js + react-leaflet, CartoDB Voyager map tiles |
| AR implementation | Native browser APIs: `getUserMedia` (camera), `DeviceOrientationEvent` (compass), `requestAnimationFrame` + Canvas 2D (arrow rendering) |
| GPS | `navigator.geolocation.watchPosition()` with Haversine distance formula |
| AI content generation | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Backend | Node.js 23 + Express |
| Database | Node.js built-in `node:sqlite` (DatabaseSync) |
| QR codes | `qrcode.react` library |
| Fonts | Orbitron (headers), Share Tech Mono (data), Google Fonts |
| Deployment hardware | Any modern smartphone with a browser (iOS Safari 15.4+, Android Chrome 99+) |

### Scope of Implementation
The current build is a **functional prototype with full core implementation**. All primary features are fully operational:
- Teacher session creation, map checkpoint placement (GPS-based), QR code generation, live monitoring
- Student GPS navigation, AR directional overlay, AI task generation, hint system, scoring, leaderboard
- Session rejoin for both teachers and students via localStorage persistence
- AI debrief report generation at session end

Partial implementations and known limitations:
- AR direction accuracy depends on device compass calibration; some Android devices show compass drift in low-interference environments.
- The AR overlay is implemented via Canvas 2D API rather than WebXR or AR.js marker-tracking, which means virtual objects are not anchored to specific physical surfaces but rather displayed as HUD-style overlays.
- No offline mode; an internet connection is required for AI task generation (though static fallback tasks are provided if the API key is absent).

---

## 8. Usability and User Experience

### Ease of Use and Intuitiveness
The application is designed around the principle that a student with no prior briefing should be able to join a session and begin navigating within 60 seconds. This is achieved through:

- **Familiarity-first onboarding** — Joining by QR code or short alphanumeric code mirrors flows students already know from games and class tools (Kahoot, Google Classroom).
- **Single-task screens** — Each phase of the student journey presents exactly one primary action, eliminating navigational ambiguity.
- **Descriptive labels** — All buttons use plain action language ("Unlock Objective," "Get Closer," "Submit and Score") rather than abstract icons that require interpretation.
- **Progressive context** — The AR view is optional; students who prefer the traditional map view are never forced into it. This respects varying comfort levels with unfamiliar technology.

### Comfort and Potential Issues
**Motion sickness** is a well-documented concern for immersive XR systems, particularly VR. In this AR implementation, the risk is significantly lower because the video feed is a real-time camera passthrough with minimal latency, and the canvas overlay is simple geometric shapes rather than complex 3D environments. However, some students who are sensitive to vestibular conflict may feel discomfort when rapidly alternating between looking at their phone screen and looking at the ground while walking. The design mitigates this by:

- Keeping the AR session time-limited (students only open it to check direction, not to stare at it continuously).
- Providing a standard map view as an equal alternative.
- Including an immediate "×" close button in the AR view that is always visible and reachable with one thumb.

**Outdoor glare** is an additional comfort consideration. The canvas draws neon-colored elements (cyan, green) against the live camera feed. In bright outdoor sunlight, screen glare may reduce visibility. Users are advised to use maximum screen brightness, and the arrow uses thick strokes with blur-based glow effects to remain distinguishable even in high-ambient-light conditions.

### Cognitive Load Considerations
As addressed in Section 6, the design minimizes extraneous cognitive load throughout. Key UX decisions include:

- **Reduced information density in AR view** — The AR screen shows only the directional arrow, distance, checkpoint name, and one button. No other navigation chrome is present, ensuring visual attention goes entirely to the directional information.
- **Graceful degradation without compass** — If the device does not support `DeviceOrientationEvent` or permission is denied, the AR view displays a pulsing ring with a `?` symbol rather than an incorrectly oriented arrow. This prevents the student from being misled by inaccurate directional data.
- **Non-punitive hint system** — Students who feel cognitively overwhelmed by a task can request up to three hints with a guaranteed minimum score of 40 points, reducing anxiety about failure and encouraging continued engagement rather than task abandonment.
- **Leaderboard timing** — The team leaderboard is accessible on demand but not persistently displayed during navigation. This means competitive social pressure is opt-in rather than constant, reducing the negative cognitive and affective load that persistent score displays can create for lower-performing students.

The overall design philosophy follows the principle that technology should reduce friction in service of the physical and cognitive experience, rather than becoming the experience itself. Students should remember the outdoor adventure; the app is the scaffold, not the destination.

---

*Document prepared as part of the XR Learning Experience Design documentation for the Orienteering: Digital AR Scavenger Hunt project.*
