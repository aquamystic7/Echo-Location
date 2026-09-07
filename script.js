// ============================================================
// ECHO LOCATION – Full Game with EVIL BOSS (Single Spawn, 3s/5s Cooldown)
// ============================================================

// ----- CANVAS SETUP -----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreDisplay');
const statusSpan = document.getElementById('statusDisplay');
const highScoreSpan = document.getElementById('highScoreDisplay');

const W = 500;
const H = 600;

// ----- HIGH SCORE -----
let highScore = parseInt(localStorage.getItem('echoHighScore')) || 0;
function updateHighScoreDisplay() { if (highScoreSpan) highScoreSpan.textContent = highScore; }
function saveHighScore() { if (score > highScore) { highScore = score; localStorage.setItem('echoHighScore', highScore); updateHighScoreDisplay(); } }

// ----- DIFFICULTY -----
let currentDifficulty = 'Medium';
const difficultyOptions = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY = {
    Easy: { beeSpawnRate: 50, beeSpeed: 1.2, powerupSpawnRate: 400 },
    Medium: { beeSpawnRate: 35, beeSpeed: 2.0, powerupSpawnRate: 300 },
    Hard: { beeSpawnRate: 20, beeSpeed: 3.0, powerupSpawnRate: 200 }
};

const diffButtons = document.querySelectorAll('.diff-btn');
function updateActiveButton() {
    diffButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.diff === currentDifficulty) btn.classList.add('active');
    });
}
updateActiveButton();

// ----- AUDIO -----
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new(window.AudioContext || window.webkitAudioContext)(); }

function playPing(leftPan) {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const panner = audioCtx.createStereoPanner();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        panner.pan.setValueAtTime(leftPan || 0, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
}

function playCollect() {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
}

function playDeath() {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
}

function playPowerup() {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
}

// ----- BOSS AUDIO -----
function playBossHit() {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
}

function playBossDefeat() {
    try {
        initAudio();
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(400 + i * 200, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.2);
            }, i * 150);
        }
    } catch (e) {}
}

// ----- BACKGROUND MUSIC -----
let musicInterval = null, musicSpeed = 1;
function startMusic() {
    stopMusic();
    musicSpeed = 1;
    playMusicTick();
    musicInterval = setInterval(() => {
        if (gameActive && !gameOver) {
            musicSpeed = 1 + score / 60;
            playMusicTick();
        }
    }, 300 / musicSpeed);
}
function stopMusic() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }
function playMusicTick() {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + score * 3, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
}

// ----- GAME STATE -----
const BAT_WIDTH = 44, BAT_HEIGHT = 44, BAT_Y = H - 80;
let player = { x: W/2 - BAT_WIDTH/2, y: BAT_Y, w: BAT_WIDTH, h: BAT_HEIGHT, speed: 5.5 };
let obstacles = [], fireflies = [], particles = [], score = 0, gameActive = false, gameOver = false, frameCount = 0;
let sonarActive = false, sonarTimer = 0, SONAR_DURATION = 18;
let sonarCooldown = 0;
let sonarCooldownFrames = 300; // 5 seconds default
let shakeX = 0, shakeY = 0, shakeIntensity = 0;
let beeSpawnRate = 35, beeSpeed = 2.0;
let leftPressed = false, rightPressed = false;

let combo = 0, maxCombo = 0, comboDisplayTimer = 0;
let countdown = 0, countdownActive = false;
let enterPressCount = 0, lastEnterTime = 0;
let discoMode = false, discoTimer = 0, discoHue = 0;

let shieldActive = false, shieldTimer = 0, SHIELD_DURATION = 300;
let speedBoostActive = false, speedBoostTimer = 0, SPEED_BOOST_DURATION = 300, originalSpeed = 5.5;
let magnetActive = false, magnetTimer = 0, MAGNET_DURATION = 300, MAGNET_RADIUS = 150;
let trailParticles = [], TRAIL_LENGTH = 15;
let doublePointsActive = false, doublePointsTimer = 0, DOUBLE_POINTS_DURATION = 300;
let slowMotionActive = false, slowMotionTimer = 0, SLOW_MOTION_DURATION = 300;
let miniBatActive = false, miniBatTimer = 0, MINI_BAT_DURATION = 300, originalBatWidth = 44, originalBatHeight = 44;
let multiShotActive = false, multiShotTimer = 0, MULTI_SHOT_DURATION = 300, multiShotCount = 0;
let extraLives = 0, MAX_EXTRA_LIVES = 3;
let powerups = [], powerupSpawnTimer = 0, POWERUP_SPAWN_INTERVAL = 300;

const POWERUP_SYMBOLS = { shield: '🛡️', speed: '⚡', magnet: '🧲', doublepoints: '⭐', slowmotion: '⏳', minibat: '🔽', multishot: '🌈', extralife: '❤️' };
const POWERUP_COLORS = { shield: '#4a9eff', speed: '#ffd93d', magnet: '#a855f7', doublepoints: '#ff6b9d', slowmotion: '#50c878', minibat: '#ff8c00', multishot: '#ff6bff', extralife: '#ff4444' };

// ----- BOSS BATTLE (Single Spawn) -----
let bossActive = false;
let bossHealth = 0;
const BOSS_MAX_HEALTH = 10;
let bossX = 0, bossY = 0;
const BOSS_SIZE = 60;
let bossAttackTimer = 0;
const BOSS_ATTACK_COOLDOWN = 45;
let bossProjectiles = [];
let bossDefeated = false; // Stays true forever after defeat (no respawn)

// ----- HELPERS (unchanged) -----
function triggerShake(intensity) { shakeIntensity = Math.min(shakeIntensity + intensity, 12); }
function updateShake() {
    if (shakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity * 1.8;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 1.8;
        shakeIntensity *= 0.92;
        if (shakeIntensity < 0.1) { shakeIntensity = 0; shakeX = 0; shakeY = 0; }
    }
}

function spawnParticles(x, y, color, count) {
    count = count || 25;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.5,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: 3 + Math.random() * 5,
            color,
            gravity: 0.05
        });
    }
}

function spawnTrailParticles(x, y) {
    if (frameCount % 2 === 0) {
        trailParticles.push({
            x: x + player.w/2 + (Math.random()-0.5)*10,
            y: y + player.h/2 + (Math.random()-0.5)*10,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: 2 + Math.random() * 4,
            vx: (Math.random()-0.5)*0.5,
            vy: (Math.random()-0.5)*0.5 - 0.2,
            color: 'rgba(74,158,255,0.6)'
        });
    }
    if (trailParticles.length > TRAIL_LENGTH * 3) trailParticles.splice(0, trailParticles.length - TRAIL_LENGTH * 3);
}

function spawnPowerup() {
    const types = ['shield','speed','magnet','doublepoints','slowmotion','minibat','multishot','extralife'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 20;
    const x = 20 + Math.random() * (W - size - 40);
    powerups.push({
        x, y: -size - 10, w: size, h: size,
        type,
        color: POWERUP_COLORS[type],
        symbol: POWERUP_SYMBOLS[type],
        speed: 1.5 + Math.random() * 0.5,
        glow: 0.5 + Math.random() * 0.5,
        pulse: 0
    });
}

function spawnFirefly() {
    const size = 12 + Math.random() * 14;
    const x = 20 + Math.random() * (W - size - 40);
    fireflies.push({ x, y: -size - 10, w: size, h: size, speed: 1.2 + Math.random() * 0.8, glow: 0.5 + Math.random() * 0.5 });
}

function spawnObstacle() {
    const size = 18 + Math.random() * 20;
    const x = 10 + Math.random() * (W - size - 20);
    let speed = beeSpeed + (score / 250);
    if (slowMotionActive) speed *= 0.5;
    obstacles.push({ x, y: -size - 10, w: size, h: size, speed, spike: Math.random() > 0.6 });
}

function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateScore() { scoreSpan.textContent = score; }

function checkDiscoMode() {
    const now = Date.now();
    if (now - lastEnterTime < 500) enterPressCount++;
    else enterPressCount = 1;
    lastEnterTime = now;
    if (enterPressCount >= 5) {
        discoMode = !discoMode;
        enterPressCount = 0;
        if (discoMode) { discoTimer = 600; playCollect(); }
    }
}

function resetGame() {
    const settings = DIFFICULTY[currentDifficulty];
    beeSpawnRate = settings.beeSpawnRate;
    beeSpeed = settings.beeSpeed;
    POWERUP_SPAWN_INTERVAL = settings.powerupSpawnRate;

    player.x = W/2 - BAT_WIDTH/2;
    player.w = originalBatWidth;
    player.h = originalBatHeight;
    player.speed = originalSpeed;
    obstacles = [];
    fireflies = [];
    particles = [];
    trailParticles = [];
    powerups = [];
    score = 0;
    gameOver = false;
    gameActive = false;
    frameCount = 0;
    sonarActive = false;
    sonarTimer = 0;
    sonarCooldown = 0;
    sonarCooldownFrames = 300;
    shakeIntensity = 0;
    shakeX = 0;
    shakeY = 0;
    combo = 0;
    maxCombo = 0;
    comboDisplayTimer = 0;
    discoMode = false;
    discoTimer = 0;
    discoHue = 0;
    enterPressCount = 0;
    extraLives = 0;
    // Reset boss
    bossActive = false;
    bossHealth = 0;
    bossDefeated = false;
    bossProjectiles = [];
    bossAttackTimer = 0;

    shieldActive = false;
    shieldTimer = 0;
    speedBoostActive = false;
    speedBoostTimer = 0;
    magnetActive = false;
    magnetTimer = 0;
    doublePointsActive = false;
    doublePointsTimer = 0;
    slowMotionActive = false;
    slowMotionTimer = 0;
    miniBatActive = false;
    miniBatTimer = 0;
    multiShotActive = false;
    multiShotTimer = 0;
    multiShotCount = 0;
    powerupSpawnTimer = 0;

    countdown = 3;
    countdownActive = true;
    updateScore();
    updateHighScoreDisplay();
    statusSpan.textContent = '⏳ GET READY';
    statusSpan.style.color = '#ffd93d';
    stopMusic();
    playCollect();
}

function gameOverHandler() {
    saveHighScore();
    gameActive = false;
    gameOver = true;
    statusSpan.textContent = '💀 GAME OVER - Press Enter';
    statusSpan.style.color = '#ff6b6b';
    playDeath();
    stopMusic();
    triggerShake(10);
    spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff4757', 50);
    shieldActive = false;
    speedBoostActive = false;
    magnetActive = false;
    doublePointsActive = false;
    slowMotionActive = false;
    miniBatActive = false;
    multiShotActive = false;
    sonarCooldown = 0;
    sonarCooldownFrames = 300;
}

function activateSonar() {
    // Prevents sonar if cooldown is active
    if (!gameActive || gameOver || sonarActive || sonarCooldown > 0) return;
    if (multiShotActive) { multiShotCount = 0; fireMultiShot(); return; }
    sonarActive = true;
    sonarTimer = SONAR_DURATION;
    const pan = (player.x / W - 0.5) * 0.8;
    playPing(pan);
    triggerShake(3);
    spawnParticles(player.x + player.w/2, player.y + player.h/2, '#4a9eff', 15);
}

function fireMultiShot() {
    if (multiShotCount >= 3 || !multiShotActive) return;
    sonarActive = true;
    sonarTimer = SONAR_DURATION;
    const pan = (player.x / W - 0.5) * 0.8 + (multiShotCount - 1) * 0.2;
    playPing(pan);
    triggerShake(3);
    spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff6bff', 15);
    multiShotCount++;
    if (multiShotCount < 3) setTimeout(() => fireMultiShot(), 150);
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    if (particles.length > 300) particles.splice(0, particles.length - 300);
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) trailParticles.splice(i, 1);
    }
}

function update() {
    if (countdownActive) {
        updateParticles();
        if (frameCount % 60 === 0) {
            countdown--;
            if (countdown <= 0) {
                countdownActive = false;
                gameActive = true;
                statusSpan.textContent = '🦇 ECHO ACTIVE';
                statusSpan.style.color = '#7bed9f';
                startMusic();
                playCollect();
            }
        }
        frameCount++;
        return;
    }
    if (!gameActive || gameOver) { updateParticles(); return; }

    let currentSpeed = player.speed;
    if (speedBoostActive) currentSpeed = originalSpeed * 2;
    if (leftPressed && player.x > 0) player.x -= currentSpeed;
    if (rightPressed && player.x + player.w < W) player.x += currentSpeed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    spawnTrailParticles(player.x, player.y);

    if (shieldActive) { shieldTimer--; if (shieldTimer <= 0) shieldActive = false; }
    if (speedBoostActive) { speedBoostTimer--; if (speedBoostTimer <= 0) { speedBoostActive = false; player.speed = originalSpeed; } }
    if (magnetActive) { magnetTimer--; if (magnetTimer <= 0) magnetActive = false; }
    if (doublePointsActive) { doublePointsTimer--; if (doublePointsTimer <= 0) doublePointsActive = false; }
    if (slowMotionActive) { slowMotionTimer--; if (slowMotionTimer <= 0) slowMotionActive = false; }
    if (miniBatActive) { miniBatTimer--; if (miniBatTimer <= 0) { miniBatActive = false; player.w = originalBatWidth; player.h = originalBatHeight; } }
    if (multiShotActive) { multiShotTimer--; if (multiShotTimer <= 0) multiShotActive = false; }

    if (sonarActive) {
        sonarTimer--;
        if (sonarTimer <= 0) {
            sonarActive = false;
            sonarCooldown = sonarCooldownFrames;
        }
    }
    if (sonarCooldown > 0) sonarCooldown--;

    powerupSpawnTimer++;
    if (powerupSpawnTimer >= POWERUP_SPAWN_INTERVAL && score > 3) {
        if (Math.random() < 0.3) spawnPowerup();
        powerupSpawnTimer = 0;
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.speed;
        p.pulse += 0.05;
        if (rectCollide(player, p)) {
            playPowerup();
            spawnParticles(p.x + p.w/2, p.y + p.h/2, p.color, 20);
            let msg = '', msgColor = '#ffffff';
            switch (p.type) {
                case 'shield': shieldActive = true; shieldTimer = SHIELD_DURATION; msg = '🛡️ SHIELD! (Blocks 1 hit)'; msgColor = '#4a9eff'; break;
                case 'speed': speedBoostActive = true; speedBoostTimer = SPEED_BOOST_DURATION; player.speed = originalSpeed * 2; msg = '⚡ SPEED BOOST! (2× faster)'; msgColor = '#ffd93d'; break;
                case 'magnet': magnetActive = true; magnetTimer = MAGNET_DURATION; msg = '🧲 MAGNET! (Attracts fireflies)'; msgColor = '#a855f7'; break;
                case 'doublepoints': doublePointsActive = true; doublePointsTimer = DOUBLE_POINTS_DURATION; msg = '⭐ 2× POINTS! (Double score)'; msgColor = '#ff6b9d'; break;
                case 'slowmotion': slowMotionActive = true; slowMotionTimer = SLOW_MOTION_DURATION; msg = '⏳ SLOW MOTION! (Obstacles 50% slower)'; msgColor = '#50c878'; break;
                case 'minibat': miniBatActive = true; miniBatTimer = MINI_BAT_DURATION; player.w = originalBatWidth * 0.5; player.h = originalBatHeight * 0.5; msg = '🔽 MINI BAT! (Smaller hitbox)'; msgColor = '#ff8c00'; break;
                case 'multishot': multiShotActive = true; multiShotTimer = MULTI_SHOT_DURATION; msg = '🌈 MULTI-SHOT! (3 sonar pings)'; msgColor = '#ff6bff'; break;
                case 'extralife': if (extraLives < MAX_EXTRA_LIVES) { extraLives++; msg = '❤️ +1 LIFE! (' + extraLives + ' total)'; } else { msg = '❤️ MAX LIVES! (' + extraLives + ')'; } msgColor = '#ff4444'; break;
            }
            statusSpan.textContent = msg;
            statusSpan.style.color = msgColor;
            setTimeout(() => { if (!gameOver && gameActive) { statusSpan.textContent = '🦇 ECHO ACTIVE'; statusSpan.style.color = '#7bed9f'; } }, 1500);
            powerups.splice(i, 1);
            continue;
        }
        if (p.y > H + 20) powerups.splice(i, 1);
    }

    if (magnetActive) {
        for (let ff of fireflies) {
            const dx = (player.x + player.w/2) - (ff.x + ff.w/2);
            const dy = (player.y + player.h/2) - (ff.y + ff.h/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < MAGNET_RADIUS && dist > 5) {
                const force = 0.3 * (1 - dist / MAGNET_RADIUS);
                ff.x += dx * force;
                ff.y += dy * force;
                if (frameCount % 5 === 0) spawnParticles(ff.x + ff.w/2, ff.y + ff.h/2, 'rgba(168,85,247,0.3)', 1);
            }
        }
    }

    // ---- Move fireflies ----
    for (let i = fireflies.length - 1; i >= 0; i--) {
        const ff = fireflies[i];
        ff.y += ff.speed;
        if (rectCollide(player, ff)) {
            combo++;
            if (combo > maxCombo) maxCombo = combo;
            comboDisplayTimer = 60;
            let points = 1 + Math.floor(score / 10);
            if (combo >= 5) points += Math.floor(combo / 2);
            if (doublePointsActive) points *= 2;
            score += points;
            updateScore();
            playCollect();
            spawnParticles(ff.x + ff.w/2, ff.y + ff.h/2, '#2ed573', 30);
            triggerShake(2);
            fireflies.splice(i, 1);
            continue;
        }
        if (ff.y > H + 20) fireflies.splice(i, 1);
    }

    // ---- BOSS SPAWN (only once per game) ----
    if (score >= 150 && !bossActive && !bossDefeated && !gameOver && gameActive) {
        console.log('👹 BOSS SPAWNING AT SCORE:', score);
        obstacles = [];
        bossActive = true;
        bossHealth = BOSS_MAX_HEALTH;
        bossX = W/2 - BOSS_SIZE/2;
        bossY = 40;
        bossAttackTimer = 0;
        bossProjectiles = [];
        // Set sonar cooldown to 3 seconds (180 frames)
        sonarCooldownFrames = 180;
        statusSpan.textContent = '👹 BOSS APPEARED! Defeat it!';
        statusSpan.style.color = '#ff4757';
        playPowerup();
        setTimeout(() => {
            if (!gameOver && gameActive) {
                statusSpan.textContent = '🦇 ECHO ACTIVE';
                statusSpan.style.color = '#7bed9f';
            }
        }, 2000);
    }

    // ---- SPAWN OBSTACLES ONLY IF BOSS NOT ACTIVE ----
    if (!bossActive && !bossDefeated) {
        const spawnRate = Math.max(12, beeSpawnRate - Math.floor(score / 6));
        if (frameCount % spawnRate === 0) {
            if (Math.random() < 0.55) spawnObstacle();
            else spawnFirefly();
            if (score > 20 && Math.random() < 0.2) spawnObstacle();
        }
    } else {
        // Still spawn fireflies when boss is active
        const fireflyRate = Math.max(20, beeSpawnRate * 0.7);
        if (frameCount % fireflyRate === 0) {
            spawnFirefly();
            if (Math.random() < 0.3) spawnFirefly();
        }
    }

    // ---- Move obstacles ----
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obs.speed;
        if (rectCollide(player, obs)) {
            if (shieldActive) {
                shieldActive = false;
                shieldTimer = 0;
                spawnParticles(obs.x + obs.w/2, obs.y + obs.h/2, '#4a9eff', 30);
                triggerShake(5);
                obstacles.splice(i, 1);
                statusSpan.textContent = '🛡️ SHIELD BROKE!';
                statusSpan.style.color = '#ff6b6b';
                setTimeout(() => { if (!gameOver && gameActive) { statusSpan.textContent = '🦇 ECHO ACTIVE'; statusSpan.style.color = '#7bed9f'; } }, 1000);
                continue;
            }
            if (extraLives > 0) {
                extraLives--;
                spawnParticles(player.x + player.w/2, player.y + player.h/2, '#ff4444', 30);
                triggerShake(5);
                obstacles.splice(i, 1);
                statusSpan.textContent = '❤️ LOST A LIFE! (' + extraLives + ' left)';
                statusSpan.style.color = '#ff4444';
                setTimeout(() => { if (!gameOver && gameActive) { statusSpan.textContent = '🦇 ECHO ACTIVE'; statusSpan.style.color = '#7bed9f'; } }, 1500);
                continue;
            }
            combo = 0;
            gameOverHandler();
            return;
        }
        if (obs.y > H + 20) obstacles.splice(i, 1);
    }

    updateParticles();

    // ---- BOSS LOGIC (if active) ----
    if (bossActive && !gameOver) {
        bossX += Math.sin(frameCount * 0.025) * 1.8;
        bossX = Math.max(0, Math.min(W - BOSS_SIZE, bossX));

        bossAttackTimer++;
        if (bossAttackTimer >= BOSS_ATTACK_COOLDOWN) {
            bossAttackTimer = 0;
            const angle = Math.atan2(
                (player.y + player.h/2) - (bossY + BOSS_SIZE/2),
                (player.x + player.w/2) - (bossX + BOSS_SIZE/2)
            );
            const speed = 4.0;
            bossProjectiles.push({
                x: bossX + BOSS_SIZE/2 - 6,
                y: bossY + BOSS_SIZE,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 12,
                life: 120
            });
        }

        for (let i = bossProjectiles.length - 1; i >= 0; i--) {
            const p = bossProjectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (rectCollide(player, {x: p.x - p.size/2, y: p.y - p.size/2, w: p.size, h: p.size})) {
                if (shieldActive) {
                    shieldActive = false;
                    shieldTimer = 0;
                    spawnParticles(p.x, p.y, '#4a9eff', 20);
                    bossProjectiles.splice(i, 1);
                    statusSpan.textContent = '🛡️ SHIELD BLOCKED!';
                    statusSpan.style.color = '#4a9eff';
                    setTimeout(() => {
                        if (!gameOver && gameActive) {
                            statusSpan.textContent = '🦇 ECHO ACTIVE';
                            statusSpan.style.color = '#7bed9f';
                        }
                    }, 1000);
                    continue;
                }
                if (extraLives > 0) {
                    extraLives--;
                    spawnParticles(p.x, p.y, '#ff4444', 20);
                    bossProjectiles.splice(i, 1);
                    statusSpan.textContent = '❤️ LOST A LIFE! (' + extraLives + ' left)';
                    statusSpan.style.color = '#ff4444';
                    setTimeout(() => {
                        if (!gameOver && gameActive) {
                            statusSpan.textContent = '🦇 ECHO ACTIVE';
                            statusSpan.style.color = '#7bed9f';
                        }
                    }, 1500);
                    continue;
                }
                gameOverHandler();
                return;
            }
            if (p.x < -20 || p.x > W + 20 || p.y > H + 20 || p.life <= 0) {
                bossProjectiles.splice(i, 1);
            }
        }

        // ---- SONAR HIT BOSS ----
        if (sonarActive) {
            const dist = Math.sqrt(
                (player.x + player.w/2 - bossX - BOSS_SIZE/2) ** 2 +
                (player.y + player.h/2 - bossY - BOSS_SIZE/2) ** 2
            );
            if (dist < 1000 && bossHealth > 0) {
                bossHealth--;
                spawnParticles(bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, '#ff6bff', 20);
                triggerShake(5);
                playBossHit();
                if (bossHealth <= 0) {
                    // ---- BOSS DEFEATED (stays defeated forever) ----
                    bossActive = false;
                    bossDefeated = true; // <- stays true forever, no respawn
                    playBossDefeat();
                    spawnParticles(bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, '#ffd93d', 50);
                    statusSpan.textContent = '👑 BOSS DEFEATED!';
                    statusSpan.style.color = '#ffd93d';
                    // Revert sonar cooldown to 5 seconds
                    sonarCooldownFrames = 300;
                    // Obstacles will start spawning again immediately (since bossDefeated is true but not active)
                    setTimeout(() => {
                        if (!gameOver && gameActive) {
                            statusSpan.textContent = '🦇 ECHO ACTIVE';
                            statusSpan.style.color = '#7bed9f';
                        }
                    }, 2500);
                } else {
                    statusSpan.textContent = '💥 BOSS HIT! (' + bossHealth + '/' + BOSS_MAX_HEALTH + ' HP)';
                    statusSpan.style.color = '#ff6bff';
                    setTimeout(() => {
                        if (!gameOver && gameActive) {
                            statusSpan.textContent = '🦇 ECHO ACTIVE';
                            statusSpan.style.color = '#7bed9f';
                        }
                    }, 1500);
                }
                sonarActive = false;
            }
        }
    }

    // ---- BOSS DEFEATED CELEBRATION (no timer to reset) ----
    // Boss defeated is permanent, so we don't need a timer. Just show the celebration animation once.
    // We'll use a separate timer for the celebration visual.

    if (frameCount % 100 === 0 && score > 5) {
        if (Math.random() < 0.3 && !bossActive && !bossDefeated) {
            for (let i = 0; i < 2; i++) spawnObstacle();
        }
    }
    frameCount++;
}

// ----- DRAW (with EVIL boss) ----
function draw() {
    ctx.save();
    updateShake();
    ctx.translate(shakeX, shakeY);

    // Disco
    if (discoMode) {
        discoTimer--;
        discoHue = (discoHue + 2) % 360;
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, `hsl(${discoHue}, 90%, 10%)`);
        grad.addColorStop(0.5, `hsl(${(discoHue+60)%360}, 90%, 15%)`);
        grad.addColorStop(1, `hsl(${(discoHue+120)%360}, 90%, 10%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        const numRays = 14, rayWidth = 10, oscillationSpeed = 0.04, swayAmplitude = 80;
        for (let i = 0; i < numRays; i++) {
            const baseX = (i/numRays) * W + rayWidth/2;
            const phase = i * 0.7 + discoHue * 0.02;
            const offset = Math.sin(frameCount * oscillationSpeed + phase) * swayAmplitude;
            const x = Math.max(0, Math.min(W - rayWidth, baseX + offset));
            const hue = (discoHue + i * 25) % 360;
            const alpha = 0.5 + 0.3 * Math.sin(frameCount * 0.04 + i * 0.5);
            const rayGrad = ctx.createLinearGradient(x, 0, x + rayWidth, H);
            rayGrad.addColorStop(0, `hsla(${hue}, 100%, 80%, ${alpha})`);
            rayGrad.addColorStop(0.4, `hsla(${(hue+30)%360}, 100%, 60%, ${alpha*0.8})`);
            rayGrad.addColorStop(1, `hsla(${(hue+60)%360}, 100%, 40%, ${alpha*0.4})`);
            ctx.fillStyle = rayGrad;
            ctx.fillRect(x, 0, rayWidth, H);
            ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.2)`;
            ctx.shadowBlur = 25;
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(x-4, 0, rayWidth+8, H);
            ctx.shadowBlur = 0;
        }
        if (frameCount % 3 === 0) spawnParticles(Math.random()*W, Math.random()*H, `hsl(${Math.random()*360},100%,70%)`, 3);
        if (discoTimer <= 0) { discoMode = false; discoHue = 0; }
    } else {
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, W, H);
    }

    if (countdownActive) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#4a9eff';
        ctx.fillStyle = '#4a9eff';
        ctx.font = 'bold 80px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(countdown > 0 ? countdown : 'GO!', W/2, H/2 - 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8899bb';
        ctx.font = '18px monospace';
        ctx.fillText('GET READY', W/2, H/2 + 70);
        ctx.restore();
        return;
    }

    if (sonarActive || gameOver) {
        ctx.strokeStyle = 'rgba(30,60,120,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }

    // Fireflies
    for (let ff of fireflies) {
        const gradient = ctx.createRadialGradient(ff.x + ff.w/2, ff.y + ff.h/2, 2, ff.x + ff.w/2, ff.y + ff.h/2, ff.w * 1.2);
        const visible = sonarActive || ff.y < 100 || Math.sin(frameCount * 0.05 + ff.x) > 0.7;
        if (visible) {
            gradient.addColorStop(0, `rgba(46,213,115,${0.8 + ff.glow * 0.2})`);
            gradient.addColorStop(0.5, `rgba(46,213,115,${0.3 + ff.glow * 0.2})`);
            gradient.addColorStop(1, 'rgba(46,213,115,0)');
        } else {
            gradient.addColorStop(0, 'rgba(46,213,115,0.05)');
            gradient.addColorStop(1, 'rgba(46,213,115,0)');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(ff.x - ff.w*0.5, ff.y - ff.h*0.5, ff.w*2, ff.h*2);
        if (visible) {
            ctx.shadowColor = '#2ed573';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.roundRect(ff.x, ff.y, ff.w, ff.h, 6);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#7bed9f';
            ctx.beginPath();
            ctx.roundRect(ff.x+3, ff.y+3, ff.w-6, ff.h-6, 4);
            ctx.fill();
            ctx.fillStyle = 'rgba(46,213,115,0.3)';
            ctx.beginPath();
            ctx.arc(ff.x + ff.w/2, ff.y + ff.h/2, ff.w * 0.8, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    // Obstacles
    for (let obs of obstacles) {
        const visible = sonarActive || obs.y < 80;
        if (visible) {
            ctx.shadowColor = '#ff4757';
            ctx.shadowBlur = 25;
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            if (obs.spike) {
                const cx = obs.x + obs.w/2;
                ctx.moveTo(cx, obs.y);
                ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                ctx.lineTo(obs.x, obs.y + obs.h);
                ctx.closePath();
            } else {
                ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 5);
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff6b81';
            if (!obs.spike) {
                ctx.beginPath();
                ctx.roundRect(obs.x+4, obs.y+4, obs.w-8, obs.h-8, 4);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = 'rgba(255,71,87,0.03)';
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
        ctx.shadowBlur = 0;
    }

    // Power-ups
    for (let p of powerups) {
        const glow = 0.7 + 0.3 * Math.sin(p.pulse);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 30 * glow;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, p.x + p.w/2, p.y + p.h/2 + 2);
    }
    ctx.shadowBlur = 0;

    // Sonar flash
    if (sonarActive) {
        const flashAlpha = (sonarTimer / SONAR_DURATION) * 0.15;
        ctx.fillStyle = `rgba(74,158,255,${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
        const ringRadius = (1 - sonarTimer / SONAR_DURATION) * 300;
        ctx.strokeStyle = `rgba(74,158,255,${0.3 * (sonarTimer / SONAR_DURATION)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.w/2, player.y + player.h/2, ringRadius, 0, Math.PI*2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(74,158,255,${0.15 * (sonarTimer / SONAR_DURATION)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(player.x + player.w/2, player.y + player.h/2, ringRadius*0.6, 0, Math.PI*2);
        ctx.stroke();
    }

    // Trail
    for (let p of trailParticles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ---- EVIL BOSS ----
    if (bossActive) {
        const bossGlow = ctx.createRadialGradient(bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, 5, bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, BOSS_SIZE*1.8);
        bossGlow.addColorStop(0, 'rgba(255,0,0,0.4)');
        bossGlow.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = bossGlow;
        ctx.fillRect(bossX - BOSS_SIZE, bossY - BOSS_SIZE, BOSS_SIZE*3, BOSS_SIZE*3);

        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.roundRect(bossX, bossY, BOSS_SIZE, BOSS_SIZE, 12);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#4a0000';
        ctx.beginPath();
        ctx.moveTo(bossX + 8, bossY + 6);
        ctx.lineTo(bossX + 2, bossY - 10);
        ctx.lineTo(bossX + 16, bossY + 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bossX + BOSS_SIZE - 8, bossY + 6);
        ctx.lineTo(bossX + BOSS_SIZE - 2, bossY - 10);
        ctx.lineTo(bossX + BOSS_SIZE - 16, bossY + 6);
        ctx.fill();

        ctx.fillStyle = '#a52a2a';
        ctx.beginPath();
        ctx.roundRect(bossX + 8, bossY + 8, BOSS_SIZE - 16, BOSS_SIZE - 16, 8);
        ctx.fill();

        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(bossX + 16, bossY + 22, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bossX + BOSS_SIZE - 16, bossY + 22, 8, 0, Math.PI*2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bossX + 14, bossY + 20, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bossX + BOSS_SIZE - 18, bossY + 20, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = '#1a0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bossX + 8, bossY + 14);
        ctx.lineTo(bossX + 22, bossY + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bossX + BOSS_SIZE - 8, bossY + 14);
        ctx.lineTo(bossX + BOSS_SIZE - 22, bossY + 18);
        ctx.stroke();

        ctx.fillStyle = '#1a0000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(bossX + BOSS_SIZE/2, bossY + 42, 16, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const tx = bossX + 10 + i * 9;
            const ty = bossY + 42;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + 4, ty - 6);
            ctx.lineTo(tx + 8, ty);
            ctx.fill();
        }
        ctx.fillStyle = '#cccccc';
        for (let i = 0; i < 4; i++) {
            const tx = bossX + 14 + i * 9;
            const ty = bossY + 46;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + 4, ty + 4);
            ctx.lineTo(tx + 8, ty);
            ctx.fill();
        }

        const healthBarX = bossX;
        const healthBarY = bossY - 16;
        const healthBarW = BOSS_SIZE;
        const healthBarH = 6;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(healthBarX, healthBarY, healthBarW, healthBarH);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(healthBarX, healthBarY, healthBarW * (bossHealth / BOSS_MAX_HEALTH), healthBarH);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarW, healthBarH);

        ctx.fillStyle = '#ff6666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('👹 BOSS', bossX + BOSS_SIZE/2, healthBarY - 4);

        for (let p of bossProjectiles) {
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ff3300';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size/2, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size/4, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    if (bossDefeated) {
        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👹 DEFEATED!', W/2, 120);
        ctx.fillStyle = '#ffd93d88';
        ctx.font = '16px monospace';
        ctx.fillText('No bonus – game continues', W/2, 170);
        // Celebration particles
        if (frameCount % 3 === 0) {
            spawnParticles(Math.random()*W, 60+Math.random()*40, `hsl(${Math.random()*360},100%,70%)`, 2);
        }
    }

    // Player
    let glowColor = '#4a9eff';
    let glowIntensity = 30;
    if (shieldActive) { glowColor = '#4a9eff'; glowIntensity = 50; }
    if (speedBoostActive) { glowColor = '#ffd93d'; glowIntensity = 50; }
    if (magnetActive) { glowColor = '#a855f7'; glowIntensity = 50; }
    if (doublePointsActive) { glowColor = '#ff6b9d'; glowIntensity = 50; }
    if (miniBatActive) { glowColor = '#ff8c00'; glowIntensity = 40; }
    if (multiShotActive) { glowColor = '#ff6bff'; glowIntensity = 50; }

    const glowGrad = ctx.createRadialGradient(
        player.x + player.w/2, player.y + player.h/2, 5,
        player.x + player.w/2, player.y + player.h/2, player.w * 1.5
    );
    glowGrad.addColorStop(0, `${glowColor}22`);
    glowGrad.addColorStop(1, `${glowColor}00`);
    ctx.fillStyle = glowGrad;
    ctx.fillRect(player.x - player.w, player.y - player.h, player.w*3, player.h*3);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowIntensity;
    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 10);
    ctx.fill();

    if (shieldActive) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(74,158,255,${0.3 + 0.3 * Math.sin(frameCount * 0.1)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(player.x-6, player.y-6, player.w+12, player.h+12, 14);
        ctx.stroke();
        ctx.strokeStyle = `rgba(74,158,255,${0.15 + 0.15 * Math.sin(frameCount * 0.1 + 1)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(player.x-10, player.y-10, player.w+20, player.h+20, 18);
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#6ab0ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h * 0.3);
    ctx.quadraticCurveTo(player.x - 12, player.y - 6, player.x - 4, player.y - 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(player.x + player.w, player.y + player.h * 0.3);
    ctx.quadraticCurveTo(player.x + player.w + 12, player.y - 6, player.x + player.w + 4, player.y - 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + 14, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.w - 10, player.y + 14, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(player.x + 10 + (leftPressed ? -2 : 2), player.y + 15, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.w - 10 + (rightPressed ? 2 : -2), player.y + 15, 2.5, 0, Math.PI*2);
    ctx.fill();

    // Particles
    for (let p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Sonar bar (with cooldown progress)
    if (gameActive && !gameOver) {
        const barX = 20, barY = H - 25, barW = 100, barH = 6;
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(barX, barY, barW, barH);
        const fill = sonarActive ? 1 : 0.3;
        ctx.fillStyle = sonarActive ? '#4a9eff' : 'rgba(74,158,255,0.3)';
        ctx.fillRect(barX, barY, barW * fill, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '8px monospace';
        ctx.fillText('SONAR', barX + 5, barY + 10);
        // Cooldown indicator (orange bar)
        if (sonarCooldown > 0) {
            const cooldownFill = sonarCooldown / sonarCooldownFrames;
            ctx.fillStyle = `rgba(255,200,100,${0.5 * (1 - cooldownFill)})`;
            ctx.fillRect(barX + 4, barY + 12, (barW - 8) * (1 - cooldownFill), 3);
        }
    }

    // Extra lives
    if (extraLives > 0) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '18px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('❤️ x' + extraLives, W - 10, 15);
    }

    // Combo
    if (combo > 0 && comboDisplayTimer > 0) {
        comboDisplayTimer--;
        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        let comboText = '🔥 x' + combo;
        if (combo >= 5) comboText += ' ✨ BONUS!';
        if (doublePointsActive) comboText += ' ⭐ 2x';
        ctx.fillText(comboText, W/2, 55);
    }

    // Power-up indicators
    let powerupIndicators = [];
    if (shieldActive) powerupIndicators.push('🛡️');
    if (speedBoostActive) powerupIndicators.push('⚡');
    if (magnetActive) powerupIndicators.push('🧲');
    if (doublePointsActive) powerupIndicators.push('⭐');
    if (slowMotionActive) powerupIndicators.push('⏳');
    if (miniBatActive) powerupIndicators.push('🔽');
    if (multiShotActive) powerupIndicators.push('🌈');
    if (powerupIndicators.length > 0) {
        ctx.fillStyle = '#ffffff88';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('✨ ' + powerupIndicators.join(' '), 15, 55);
    }

    if (discoMode) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🎉 DISCO!', 15, 15);
    }

    if (gameActive && !gameOver) {
        ctx.fillStyle = '#66779966';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('⚙️ ' + currentDifficulty, W - 10, 40);
    }

    // GAME OVER
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff4757';
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', W/2, H/2 - 110);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('GAME OVER', W/2, H/2 - 50);
        const boxX = 70, boxY = H/2 + 10, boxW = 360, boxH = 140;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = '#2a3a5a';
        ctx.lineWidth = 2;
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7bed9f';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('🏆 Score: ' + score, boxX + 15, boxY + 10);
        ctx.fillStyle = '#f5c842';
        ctx.font = '16px monospace';
        ctx.fillText('🏆 Best: ' + highScore, boxX + 15, boxY + 42);
        ctx.fillStyle = '#ffd93d';
        ctx.font = '16px monospace';
        ctx.fillText('🔥 Max Combo: ' + maxCombo, boxX + 15, boxY + 74);
        if (extraLives > 0) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '16px monospace';
            ctx.fillText('❤️ Lives: ' + extraLives, boxX + 15, boxY + 106);
        }
        ctx.fillStyle = '#8899bb';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('PRESS ENTER TO RESTART', W/2, H - 25);
    }

    // START SCREEN
    if (!gameActive && !gameOver && !countdownActive) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#4a9eff';
        ctx.fillStyle = '#4a9eff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦇', W/2, H/2 - 60);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#aabbdd';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('ECHO LOCATION', W/2, H/2 - 10);
        ctx.fillStyle = '#667799';
        ctx.font = '14px monospace';
        ctx.fillText('PRESS ENTER TO START', W/2, H/2 + 35);
        ctx.fillStyle = '#445566';
        ctx.font = '11px monospace';
        ctx.fillText('← → Move  |  ENTER = Sonar Ping', W/2, H/2 + 65);
        ctx.fillStyle = '#445566';
        ctx.font = '10px monospace';
        ctx.fillText('🏆 Best: ' + highScore, W/2, H/2 + 90);
        ctx.fillStyle = '#ff6b6b88';
        ctx.font = '9px monospace';
        ctx.fillText('🔥 Press ENTER 5× quickly for DISCO!', W/2, H/2 + 112);
        ctx.fillStyle = '#4a9eff88';
        ctx.font = '9px monospace';
        ctx.fillText('💡 Power-ups: 🛡️⚡🧲⭐⏳🔽🌈❤️', W/2, H/2 + 134);
        ctx.fillStyle = '#66779966';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('⚙️ Change difficulty with ← → arrows (below the game)', W/2, H/2 + 165);
    }

    ctx.restore();
}

// ---- Canvas roundRect ----
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2*r) r = w/2;
    if (h < 2*r) r = h/2;
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r);
    this.lineTo(x+w, y+h-r);
    this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    this.lineTo(x+r, y+h);
    this.quadraticCurveTo(x, y+h, x, y+h-r);
    this.lineTo(x, y+r);
    this.quadraticCurveTo(x, y, x+r, y);
    return this;
};

// ----- GAME LOOP -----
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ----- KEYBOARD -----
function handleKeyDown(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === ' ') {
        e.preventDefault();
        initAudio();
    }

    // Difficulty arrows (start screen OR game over)
    if (!gameActive && !countdownActive) {
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
            const currentIndex = difficultyOptions.indexOf(currentDifficulty);
            let newIndex;
            if (key === 'ArrowLeft') newIndex = (currentIndex - 1 + difficultyOptions.length) % difficultyOptions.length;
            else newIndex = (currentIndex + 1) % difficultyOptions.length;
            currentDifficulty = difficultyOptions[newIndex];
            updateActiveButton();
            if (!gameOver) {
                statusSpan.textContent = '🎯 ' + currentDifficulty;
                statusSpan.style.color = '#4a9eff';
                clearTimeout(window._diffTimeout);
                window._diffTimeout = setTimeout(() => {
                    if (!gameActive && !gameOver && !countdownActive) {
                        statusSpan.textContent = '▶ PRESS ENTER';
                        statusSpan.style.color = '#ffd93d';
                    }
                }, 1500);
            }
            return;
        }
    }

    if (key === 'Enter') {
        if (gameOver) { resetGame(); return; }
        if (!gameActive && !countdownActive) { resetGame(); return; }
        if (gameActive && !gameOver) {
            // This will only fire if cooldown allows it (activateSonar checks cooldown)
            activateSonar();
            checkDiscoMode();
        }
        return;
    }

    if (gameActive && !gameOver) {
        if (key === 'ArrowLeft') leftPressed = true;
        else if (key === 'ArrowRight') rightPressed = true;
    }
}

function handleKeyUp(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === ' ') e.preventDefault();
    if (key === 'ArrowLeft') leftPressed = false;
    if (key === 'ArrowRight') rightPressed = false;
}

window.addEventListener('blur', () => { leftPressed = false; rightPressed = false; });
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// ----- TOUCH CONTROLS -----
const touchLeft = document.getElementById('touchLeft');
const touchRight = document.getElementById('touchRight');
const touchEnter = document.getElementById('touchEnter');

if (touchLeft && touchRight && touchEnter) {
    let tapCount = 0, lastTapTime = 0;

    touchLeft.addEventListener('touchstart', function(e) { e.preventDefault(); leftPressed = true; this.classList.add('active-touch'); });
    touchLeft.addEventListener('touchend', function(e) { e.preventDefault(); leftPressed = false; this.classList.remove('active-touch'); });
    touchLeft.addEventListener('touchcancel', function(e) { leftPressed = false; this.classList.remove('active-touch'); });
    touchLeft.addEventListener('mousedown', function(e) { e.preventDefault(); leftPressed = true; this.classList.add('active-touch'); });
    touchLeft.addEventListener('mouseup', function(e) { e.preventDefault(); leftPressed = false; this.classList.remove('active-touch'); });
    touchLeft.addEventListener('mouseleave', function(e) { leftPressed = false; this.classList.remove('active-touch'); });

    touchRight.addEventListener('touchstart', function(e) { e.preventDefault(); rightPressed = true; this.classList.add('active-touch'); });
    touchRight.addEventListener('touchend', function(e) { e.preventDefault(); rightPressed = false; this.classList.remove('active-touch'); });
    touchRight.addEventListener('touchcancel', function(e) { rightPressed = false; this.classList.remove('active-touch'); });
    touchRight.addEventListener('mousedown', function(e) { e.preventDefault(); rightPressed = true; this.classList.add('active-touch'); });
    touchRight.addEventListener('mouseup', function(e) { e.preventDefault(); rightPressed = false; this.classList.remove('active-touch'); });
    touchRight.addEventListener('mouseleave', function(e) { rightPressed = false; this.classList.remove('active-touch'); });

    touchEnter.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.classList.add('active-touch');
        const now = Date.now();
        if (now - lastTapTime < 500) tapCount++;
        else tapCount = 1;
        lastTapTime = now;
        if (tapCount >= 5) {
            enterPressCount = 5;
            checkDiscoMode();
            tapCount = 0;
            this.style.background = 'rgba(255,100,255,0.6)';
            this.style.borderColor = '#ff6bff';
            setTimeout(() => { this.style.background = ''; this.style.borderColor = ''; this.classList.remove('active-touch'); }, 400);
            return;
        }
        // Touch sonar also respects cooldown
        if (gameActive && !gameOver && !countdownActive) activateSonar();
        else if (gameOver || (!gameActive && !countdownActive)) resetGame();
    });
    touchEnter.addEventListener('touchend', function(e) { e.preventDefault(); this.classList.remove('active-touch'); this.style.background = ''; this.style.borderColor = ''; });
    touchEnter.addEventListener('touchcancel', function(e) { this.classList.remove('active-touch'); this.style.background = ''; this.style.borderColor = ''; });
    touchEnter.addEventListener('mousedown', function(e) {
        e.preventDefault();
        this.classList.add('active-touch');
        const now = Date.now();
        if (now - lastTapTime < 500) tapCount++;
        else tapCount = 1;
        lastTapTime = now;
        if (tapCount >= 5) {
            enterPressCount = 5;
            checkDiscoMode();
            tapCount = 0;
            this.style.background = 'rgba(255,100,255,0.6)';
            this.style.borderColor = '#ff6bff';
            setTimeout(() => { this.style.background = ''; this.style.borderColor = ''; this.classList.remove('active-touch'); }, 400);
            return;
        }
        if (gameActive && !gameOver && !countdownActive) activateSonar();
        else if (gameOver || (!gameActive && !countdownActive)) resetGame();
    });
    touchEnter.addEventListener('mouseup', function(e) { e.preventDefault(); this.classList.remove('active-touch'); this.style.background = ''; this.style.borderColor = ''; });
    touchEnter.addEventListener('mouseleave', function(e) { this.classList.remove('active-touch'); this.style.background = ''; this.style.borderColor = ''; });
}

// ----- INIT -----
gameActive = false;
gameOver = false;
statusSpan.textContent = '▶ PRESS ENTER';
statusSpan.style.color = '#ffd93d';
updateHighScoreDisplay();

for (let i = 0; i < 30; i++) {
    particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        life: 50 + Math.random() * 100,
        maxLife: 150,
        size: 1 + Math.random() * 2,
        color: 'rgba(74,158,255,0.1)',
        gravity: 0
    });
}

gameLoop();

window.addEventListener('unload', () => {
    stopMusic();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});

console.log('🦇 ECHO LOCATION GAME READY');
console.log('🎮 Controls: ← → Move | ENTER = Sonar Ping');
console.log('🎉 Easter Egg: Press ENTER 5× for DISCO!');
console.log('👹 Boss spawns once at score 150 – 10 HP, 3s cooldown during fight, 5s after defeat.');
console.log('⚙️ Difficulty: ' + currentDifficulty + ' (← → arrows on start screen or after game over)');