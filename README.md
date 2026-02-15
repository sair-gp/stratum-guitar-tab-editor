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

## 🛠️ Architecture
The project follows a modular "DNA-first" approach:
1. **Types Layer:** Single source of truth for the tab hierarchy.
2. **Store Layer:** Coordinate-based state updates.
3. **Hook Layer:** Decoupled keyboard and navigation logic.
4. **UI Layer:** Highly responsive CSS Grid components.

---
*Created with the **STRATUM** Protocol — Built for Precision.*