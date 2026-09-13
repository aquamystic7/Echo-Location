# 🦇 Echo Location — Sonar Dodger Game

> **A sonar-based dodging game where you navigate in darkness using sound — built with only 3 keys: Left, Right, and Enter.**

![Game](https://img.shields.io/badge/Game-Echo%20Location-4a9eff?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-e34f26?style=for-the-badge&logo=html5&logoColor=white)
![Accessibility](https://img.shields.io/badge/Accessibility-Blindfold%20Friendly-2ed573?style=for-the-badge)

---

## 🎯 About the Game

**Echo Location** is a unique, accessibility-first arcade game where you play as a bat navigating through a dark cave. Instead of relying on sight, you use **sonar pings** (pressing **Enter**) to briefly reveal your surroundings.

The game is designed with **only three keys** — Left Arrow, Right Arrow, and Enter — making it intuitive, memorable, and accessible to everyone, including players with visual impairments who can play using only the stereo audio cues.

---

## 🎮 How to Play

| Key | Action |
|-----|--------|
| **←** Left Arrow | Move bat left |
| **→** Right Arrow | Move bat right |
| **Enter** | Sonar ping (reveals the world) |
| **Enter × 5 (quick)** | 🎉 Trigger Disco Mode (Easter egg) |
| **← → on start screen** | Change difficulty |

### Objective
- 🟢 **Collect green fireflies** to earn points.
- 🔴 **Dodge red obstacles** — one hit ends your run.
- 👹 **Defeat the boss** at score 150 to prove your mastery.

---

## ⚡ Power-Ups

Collect falling icons to gain temporary abilities:

| Icon | Name | Effect |
|------|------|--------|
| 🛡️ | Shield | Blocks 1 obstacle hit |
| ⚡ | Speed | 2× movement speed (5 sec) |
| 🧲 | Magnet | Attracts nearby fireflies (5 sec) |
| ⭐ | 2× Points | Double score for 5 seconds |
| ⏳ | Slow Motion | Obstacles move 50% slower |
| 🔽 | Mini Bat | Smaller hitbox (5 sec) |
| 🌈 | Multi-Shot | Fires 3 sonar pings in a row |
| ❤️ | Extra Life | Survive one extra hit |

---

## 👹 Boss Battle

- **Spawns once** when your score reaches **150**.
- Has **10 HP** — hit it 10 times with your sonar.
- **Sonar cooldown is reduced to 3 seconds** during the fight (normally 5 seconds).
- Defeating the boss continues the game with no bonus points — just glory!
- The boss **never respawns** in the same run.

---

## 🎯 Difficulty Levels

Select your challenge on the start screen using **← →** arrow keys:

| Difficulty | Obstacle Speed | Spawn Rate |
|------------|----------------|------------|
| 🟢 Easy | Slow | Low |
| 🟡 Medium | Normal | Normal |
| 🔴 Hard | Fast | High |

---

## 🎉 Easter Egg — Disco Mode

Press **Enter 5 times quickly** during gameplay to trigger a **10-second disco party** with:
- 🌈 Rainbow vertical light beams from the top
- 🎵 Swaying rays that move left and right
- ✨ Sparkle particles bursting everywhere

---

## ✨ Features

- ✅ **Accessible Design** — Playable blindfolded using stereo audio
- ✅ **3-Key Controls** — Left, Right, Enter (that's it!)
- ✅ **8 Power-Ups** — Each with unique visual and gameplay effects
- ✅ **Combo System** — Build combos for bonus points
- ✅ **Persistent High Score** — Saved via localStorage
- ✅ **Difficulty Levels** — Easy, Medium, Hard
- ✅ **Boss Battle** — A challenging end-game encounter
- ✅ **Touch Controls** — Works on mobile and tablet
- ✅ **Hidden Disco Mode** — Surprise for curious players
- ✅ **Dynamic Music** — Background beat that speeds up with your score
- ✅ **Smooth Animations** — Particles, screen shake, glow effects

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 Canvas | Real-time game rendering |
| Vanilla JavaScript | Game logic, physics, AI |
| Web Audio API | 3D stereo sound effects & music |
| localStorage | Persistent high score saving |
| CSS3 | Responsive styling and UI |

---

## 🤖 AI Usage

This project was built with assistance from **OpenCode Zen** — an agentic AI coding assistant that writes code directly to project files.

**Human-driven:**
- Game concept and design
- Playtesting on real Chromebook and mobile devices
- Bug reports and feature direction
- Final quality decisions

**AI-driven:**
- Code generation and debugging
- Feature scaffolding (power-ups, boss, combo system)
- Web Audio API implementation
- README and inline comments

**Hackatime verified:** 12h 53m human coding — less than 0.5% AI-assisted.

All AI-generated code was reviewed, tested, and understood before use. The game reflects our own creative vision, with AI as a development accelerant — not a replacement.

## 🚀 How to Run

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Echo-Location.git
