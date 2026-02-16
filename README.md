TL;DR:

> Stratum is a fast, web-based guitar tab editor with semantic keyboard controls. Free and no login required. Start composing instantly.


# 🎸 Stratum
> **High-Precision Multi-Row Guitar Tablature Editor**

Stratum is a web-based guitar tab editor built for speed. Unlike traditional "click-and-place" editors, Stratum utilizes a **semantic keyboard engine** and a **fixed 24-measure grid** to provide a composition experience that feels like playing an instrument.



---

## ⚡ Core Philosophy
Stratum is built on three pillars of design:
- **Analytic Navigation:** Jump across strings and measures using custom keybindings.
- **Meticulous Layout:** A strict 24-column grid ensures your score remains perfectly aligned across multiple staves.
- **Tactical Configuration:** Full control over your environment, from custom tunings to personalized shortcut registries.

## 🚀 Technical Highlights
- **Framework:** React 18 + TypeScript (Strict Mode)
- **State Management:** Context API with specialized stores for Tab Data and User Shortcuts.
- **Persistence:** Versioned LocalStorage persistence with manual "Save to Disk" protocols.
- **Keyboard Engine:** High-performance event listener for 3D coordinate-based navigation (Row, Column, String).

## 🎹 Global Commands & HUD
Stratum features a persistent Heads-Up Display to keep you in the zone:
- **Shift + Arrows:** Rapid measure-snapping (Jump 4 columns).
- **Q, B, G, D, A, E (Default):** Semantic string selection.
- **Enter:** Automatic measure iteration/Row wrapping.
- **Ctrl + S:** Manual state persistence.

## 🏗️ Architecture
The project follows a modular "DNA-first" approach:
1. **Types Layer:** Single source of truth for the tab hierarchy.
2. **Store Layer:** Coordinate-based state updates.
3. **Hook Layer:** Decoupled keyboard and navigation logic.
4. **UI Layer:** Highly responsive CSS Grid components.

🛠️ Technical Challenges & Solutions
1. The Double-Digit Fret Race Condition

Challenge: Standard guitar fretboards range from 0 to 24. A naive implementation of keyboard input would overwrite '1' with '9' when attempting to type fret '19'.
Solution: Implemented a Temporal Buffer Logic within the state-update function. The engine checks the current cell value: if it contains a single digit and the resulting combination is ≤24, it appends the new input. Otherwise, it treats the input as a fresh entry. This ensures fluid, natural data entry without requiring a secondary "confirm" key.
2. Semantic Shortcut Mapping & Conflict Resolution

Challenge: Users need the ability to remap keys (e.g., changing 'B' to 'K' for the 2nd string). However, allowing arbitrary remapping could lead to "ghost" mappings where one key triggers multiple actions, or worse, hijacks numeric fret data.
Solution: Developed a Shortcut Registry with a strictly enforced 1:1 action-to-key ratio.

    Ghost Prevention: The remapping logic performatively deletes any existing key-assignment for a target action before assigning a new one.

    Data Integrity Gate: Numeric keys (0-9) are hard-coded as "Reserved" at the store level, preventing users from accidentally disabling their ability to input fret data.

3. Coordinate-Based 3D State Management

Challenge: Transitioning from a single-row "flat" grid to a professional multi-staff document required a move from 2D coordinates (Column,String) to 3D coordinates (Row,Column,String).
Solution: Refactored the entire TabStore to utilize a hierarchical tree structure. Navigation logic was updated with Boundary Awareness, allowing the cursor to "wrap" from the end of one staff (Column 23) to the beginning of the next (Row + 1, Column 0) seamlessly, maintaining the composer's flow.
4. Focus Gating & Event Interference

Challenge: Global keyboard listeners are "greedy." Without proper gating, trying to type a new shortcut name in the settings menu would simultaneously input notes into the background editor.
Solution: Implemented a Tactical Focus Gate using HTML data-attributes and tag-name verification. The Keyboard Engine intercepts the event and performs a metadata check: if document.activeElement is an input or carries the data-settings-input attribute, the engine immediately mutes itself, allowing the configuration UI to take priority.

[Live Demo](https://stratum-guitar-tab-editor.vercel.app/)

---
*Created with the **STRATUM** Protocol — Built for Precision.*