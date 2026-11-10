# SafeCampus (Raksha Path) — 2-3 Minute Hackathon Demo Script

> **Track**: Student Innovation Track (Women in Tech Hackathon)  
> **Target Audience**: Judges, Campus Safety Administrators, Peer Students  
> **Core Theme**: Closing the Full Safety Loop — **PREVENT ➔ RESPOND ➔ RESOLVE** in 3D

---

## ⏱️ Timeline & Walkthrough

### 0:00 - 0:35 | The 3D Campus Fly-In & PREVENT
- **Speaker**:  
  *"Every night across thousands of college campuses, students—especially female hostellers—face a harrowing dilemma: take the dark, isolated shortcut to save 3 minutes, or risk navigating unpatrolled corners with broken streetlights. Today, we present **SafeCampus (Raksha Path)**, an installable 3D PWA that covers the complete loop: Prevent, Respond, and Resolve."*
- **Action on Screen**:
  1. Open the app on mobile viewport. Show the **3D MapLibre view** at pitch 58° with extruded buildings. Point out how hostel complexes are highlighted in vibrant rose (`#be185d`).
  2. Tap the **Campus button** in the header. Select **IIT Delhi** or search a university. Watch the **cinematic 3D fly-in**: the camera smoothly glides down at pitch 60° with a slow 3-second bearing rotation as vector buildings rise into view.
  3. Show the **2D / 3D toggle**: effortlessly tilt down to 2D top-down view and back into 3D perspective.

---

### 0:35 - 1:10 | Safe Route Navigator & 3D Camera Route Preview
- **Speaker**:  
  *"Students shouldn't have to guess which path is safe. Our weighted graph pathfinding analyzes real-time incident density, lighting quality, and security posts."*
- **Action on Screen**:
  1. Tap the **Walk** tab on the bottom navigation.
  2. Origin: `Central Library` ➔ Destination: `Girls Hostel Complex`.
  3. Compare the two contrasting routes:
     - **Fastest Shortcut**: 5 min, but flags a danger score ($58/100$) because it traverses unlit groves with 4 recent harassment reports.
     - **Safest Route**: **96/100 Safety Index** along the brightly lit boulevard past 2 active guard booths.
  4. Tap **Preview in 3D Flight**: The camera smoothly takes flight along the green glowing path at pitch 65°, gliding from the library to the girls hostel over 10 seconds!
  5. Tap **Start "Walk With Me"**: Demonstrate the active countdown ETA timer, safe check-in prompt, and $50\text{m}$ route deviation auto-alert.

---

### 1:10 - 1:45 | Anonymous Issue Reporting with AI Classifier (FIX)
- **Speaker**:  
  *"Safety isn't just about reacting to danger; it's about eliminating hazards before someone gets hurt. As our student walks, she spots a broken sodium streetlight."*
- **Action on Screen**:
  1. Tap the **Report** tab on the bottom navigation.
  2. Point out **Anonymous Mode is ON by default** with a single click.
  3. Tap the quick preset: `💡 Unlit Gate 3 Walkway`.
  4. Click **Submit & AI Classify Issue**.
  5. Watch the celebratory confetti! Show the instant AI Classification badge:
     - **Urgency: 4/5**
     - **AI Summary**: *"Broken sodium streetlight causing blind darkness at Gate 3 after 8 PM."*
     - **Routed to**: *Electrical Maintenance Dept*.
  6. Point to the **Report Tracker** displaying the live 4-step progress: `Submitted ➔ Assigned ➔ In Progress ➔ Resolved`.

---

### 1:45 - 2:20 | High-Stakes Emergency: Multi-Trigger Silent SOS (RESPOND)
- **Speaker**:  
  *"Now imagine an emergency unfolds. A student is cornered. Dialing phone numbers is impossible. SafeCampus provides five stealth triggers."*
- **Action on Screen**:
  1. Tap the prominent **SOS** tab in the center of the bottom navigation.
  2. Show the glowing circular SOS panic button with the **2-second hold-to-activate progress ring**.
  3. Demonstrate the **Shake Phone** accelerometer simulation button or **3x rapid volume press**.
  4. The **Silent SOS Dispatched Modal** pops up instantly:
     - Dispatched to **Campus Security Control Room**.
     - Broadcast to 3 trusted contacts with a direct Google Maps pin.
     - Notified **3 nearby opted-in Safety Buddies** within 250m.
     - 5-second ambient audio clip captured.
  5. Tap **Switch to Calculator Disguise**: Show the functional fake calculator screen! If an aggressor glances at the phone, it looks like a standard math tool. Enter `911=` to silently confirm distress, or `1234=` to exit disguise.

---

### 2:20 - 3:00 | The Administrative Resolution Loop & 3D Hotspot Map (ADMIN)
- **Speaker**:  
  *"SafeCampus closes the loop for university administrations with real-time analytics and preventive action."*
- **Action on Screen**:
  1. In the header, click the **Student ➔ Admin View** toggle button.
  2. Click the **Admin** tab.
  3. Show the **Visual Analytics**: 60 reports categorized with Recharts, average response time of 18 minutes.
  4. Tap the **3D Hotspot Map** tab: The full 3D extruded campus renders with clustered incident pins and a native GPU density heatmap!
  5. Show the **AI Recommendation Cards**: *"Install 4 High-Lumen Solar Lights at Gate 3 Turn — 14 complaints logged between 8 PM and midnight."*
  6. Switch to **Incident Dispatcher**: Find the Gate 3 ticket, assign it to *Maintenance Dept*, and click **Mark Resolved** with a single tap.

---

## 💡 Quick Tips for the Presenter
- Make sure to showcase the **3D Route Flight Preview**—judges love dynamic camera animations.
- Show the **Day/Night toggle** (moon icon in header) to demonstrate how night mode darkens 3D buildings and illuminates glowing street lamps.
- Emphasize that the app runs 100% offline via local storage and Service Worker caching.
