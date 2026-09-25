const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('scoreDisplay');
const statusSpan = document.getElementById('statusDisplay');
const highScoreSpan = document.getElementById('highScoreDisplay');

const W = 500;
const H = 600;

let highScore = parseInt(localStorage.getItem('echoHighScore')) || 0;

function refreshHighScore() {
    if (highScoreSpan) highScoreSpan.textContent = highScore;
}

function trySaveScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('echoHighScore', highScore);
        refreshHighScore();
    }
}

let statusTimer = null;

function flashStatus(text, color, duration) {
    statusSpan.textContent = text;
    statusSpan.style.color = color;

    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        if (gameActive && !gameOver) {
            statusSpan.textContent = '🦇 ECHO ACTIVE';
            statusSpan.style.color = '#7bed9f';
        }
    }, duration);
}

let currentDifficulty = 'Medium';
const difficultyOptions = ['Easy', 'Medium', 'Hard'];

const DIFFICULTY = {
    Easy:   { beeSpawnRate: 50, beeSpeed: 1.2, powerupSpawnRate: 400 },
    Medium: { beeSpawnRate: 35, beeSpeed: 2.0, powerupSpawnRate: 300 },
    Hard:   { beeSpawnRate: 20, beeSpeed: 3.0, powerupSpawnRate: 200 }
};

const diffButtons = document.querySelectorAll('.diff-btn');

function highlightCurrentDiff() {
    diffButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.diff === currentDifficulty) btn.classList.add('active');
    });
}
highlightCurrentDiff();

let audioCtx = null;

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function sonarSound(panAmount) {
    try {
        ensureAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        // stereo position based on where the bat is
        const direction = audioCtx.createStereoPanner();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

        direction.pan.setValueAtTime(panAmount || 0, audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(direction);
        direction.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
}

function pickupSound() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = 'sine';
        o.frequency.setValueAtTime(600, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);

        g.gain.setValueAtTime(0.2, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
}

function deathSound() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);

        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
}

function powerupSound() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = 'square';
        o.frequency.setValueAtTime(400, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.2);

        g.gain.setValueAtTime(0.15, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
}

function bossHitSound() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);

        g.gain.setValueAtTime(0.2, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
}

function bossDefeatedSound() {
    try {
        ensureAudio();

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'square';
                o.frequency.setValueAtTime(400 + i * 200, audioCtx.currentTime);
                g.gain.setValueAtTime(0.15, audioCtx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                o.connect(g);
                g.connect(audioCtx.destination);
                o.start();
                o.stop(audioCtx.currentTime + 0.2);
            }, i * 150);
        }
    } catch (e) {}
}

let musicTimer = null;
let musicTempo = 1;

function startBeat() {
    stopBeat();
    musicTempo = 1;
    musicTick();

    musicTimer = setInterval(() => {
        if (gameActive && !gameOver) {
            musicTempo = 1 + score / 60;
            musicTick();
        }
    }, 300 / musicTempo);
}

function stopBeat() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

function musicTick() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = 'sine';
        o.frequency.setValueAtTime(300 + score * 3, audioCtx.currentTime);

        g.gain.setValueAtTime(0.04, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

        o.connect(g);
        g.connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
}

const BAT_WIDTH = 44;
const BAT_HEIGHT = 44;
const BAT_Y = H - 80;

let player = {
    x: W/2 - BAT_WIDTH/2,
    y: BAT_Y,
    w: BAT_WIDTH,
    h: BAT_HEIGHT,
    speed: 5.5
};

let obstacles = [];
let fireflies = [];
let particles = [];
let score = 0;
let gameActive = false;
let gameOver = false;
let frameCount = 0;

let sonarActive = false;
let sonarTimer = 0;
const SONAR_DURATION = 18;
let sonarCooldown = 0;
let sonarCooldownFrames = 300;

let shakeX = 0;
let shakeY = 0;
let shakeIntensity = 0;

let beeSpawnRate = 35;
let beeSpeed = 2.0;

let leftPressed = false;
let rightPressed = false;

let combo = 0;
let maxCombo = 0;
let comboDisplayTimer = 0;

let countdown = 0;
let countdownActive = false;

let enterPressCount = 0;
let lastEnterTime = 0;
let discoMode = false;
let discoTimer = 0;
let discoHue = 0;

let shieldActive = false;
let shieldTimer = 0;
const SHIELD_DURATION = 300;

let speedBoostActive = false;
let speedBoostTimer = 0;
const SPEED_BOOST_DURATION = 300;
let originalSpeed = 5.5;

let magnetActive = false;
let magnetTimer = 0;
const MAGNET_DURATION = 300;
const MAGNET_RADIUS = 150;

let trailParticles = [];
const TRAIL_LENGTH = 15;

let doublePointsActive = false;
let doublePointsTimer = 0;
const DOUBLE_POINTS_DURATION = 300;

let slowMotionActive = false;
let slowMotionTimer = 0;
const SLOW_MOTION_DURATION = 300;

let miniBatActive = false;
let miniBatTimer = 0;
const MINI_BAT_DURATION = 300;
let originalBatWidth = 44;
let originalBatHeight = 44;

let multiShotActive = false;
let multiShotTimer = 0;
const MULTI_SHOT_DURATION = 300;
let multiShotCount = 0;

let extraLives = 0;
const MAX_EXTRA_LIVES = 3;

let powerups = [];
let powerupSpawnTimer = 0;
let POWERUP_SPAWN_INTERVAL = 300;

const POWERUP_SYMBOLS = {
    shield: '🛡️',
    speed: '⚡',
    magnet: '🧲',
    doublepoints: '⭐',
    slowmotion: '⏳',
    minibat: '🔽',
    multishot: '🌈',
    extralife: '❤️'
};

const POWERUP_COLORS = {
    shield: '#4a9eff',
    speed: '#ffd93d',
    magnet: '#a855f7',
    doublepoints: '#ff6b9d',
    slowmotion: '#50c878',
    minibat: '#ff8c00',
    multishot: '#ff6bff',
    extralife: '#ff4444'
};

let bossActive = false;
let bossHealth = 0;
const BOSS_MAX_HEALTH = 10;
let bossX = 0;
let bossY = 0;
const BOSS_SIZE = 60;
let bossAttackTimer = 0;
const BOSS_ATTACK_COOLDOWN = 45;
let bossProjectiles = [];
let bossDefeated = false;


function shakeScreen(amount) {
    shakeIntensity = Math.min(shakeIntensity + amount, 12);
}

function updateScreenShake() {
    if (shakeIntensity <= 0) return;

    shakeX = (Math.random() - 0.5) * shakeIntensity * 1.8;
    shakeY = (Math.random() - 0.5) * shakeIntensity * 1.8;
    shakeIntensity *= 0.92;

    if (shakeIntensity < 0.1) {
        shakeIntensity = 0;
        shakeX = 0;
        shakeY = 0;
    }
}

function burst(x, y, col, amount) {
    const n = amount || 25;
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 0.5,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: 3 + Math.random() * 5,
            color: col,
            gravity: 0.05
        });
    }
}

function dropTrail(x, y) {
    if (frameCount % 2 !== 0) return;

    trailParticles.push({
        x: x + player.w/2 + (Math.random() - 0.5) * 10,
        y: y + player.h/2 + (Math.random() - 0.5) * 10,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.2,
        color: 'rgba(74,158,255,0.6)'
    });

    if (trailParticles.length > TRAIL_LENGTH * 3) {
        trailParticles.splice(0, trailParticles.length - TRAIL_LENGTH * 3);
    }
}

function makePowerup() {
    const pool = ['shield', 'speed', 'magnet', 'doublepoints', 'slowmotion', 'minibat', 'multishot', 'extralife'];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const size = 20;
    const xPos = 20 + Math.random() * (W - size - 40);

    powerups.push({
        x: xPos,
        y: -size - 10,
        w: size,
        h: size,
        type: pick,
        color: POWERUP_COLORS[pick],
        symbol: POWERUP_SYMBOLS[pick],
        speed: 1.5 + Math.random() * 0.5,
        glow: 0.5 + Math.random() * 0.5,
        pulse: 0
    });
}

function makeFirefly() {
    const size = 12 + Math.random() * 14;
    const xPos = 20 + Math.random() * (W - size - 40);

    fireflies.push({
        x: xPos,
        y: -size - 10,
        w: size,
        h: size,
        speed: 1.2 + Math.random() * 0.8,
        glow: 0.5 + Math.random() * 0.5
    });
}

function makeObstacle() {
    const size = 18 + Math.random() * 20;
    const xPos = 10 + Math.random() * (W - size - 20);
    let spd = beeSpeed + (score / 250);
    if (slowMotionActive) spd *= 0.5;

    obstacles.push({
        x: xPos,
        y: -size - 10,
        w: size,
        h: size,
        speed: spd,
        spike: Math.random() > 0.6
    });
}

function hits(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

function showScore() {
    scoreSpan.textContent = score;
}

function trackDiscoPress() {
    const now = Date.now();

    if (now - lastEnterTime < 500) enterPressCount++;
    else enterPressCount = 1;

    lastEnterTime = now;

    if (enterPressCount >= 5) {
        discoMode = !discoMode;
        enterPressCount = 0;
        if (discoMode) {
            discoTimer = 600;
            pickupSound();
        }
    }
}


function grabShield() {
    shieldActive = true;
    shieldTimer = SHIELD_DURATION;
    flashStatus('🛡️ SHIELD! (Blocks 1 hit)', '#4a9eff', 1500);
}

function grabSpeed() {
    speedBoostActive = true;
    speedBoostTimer = SPEED_BOOST_DURATION;
    player.speed = originalSpeed * 2;
    flashStatus('⚡ SPEED BOOST! (2× faster)', '#ffd93d', 1500);
}

function grabMagnet() {
    magnetActive = true;
    magnetTimer = MAGNET_DURATION;
    flashStatus('🧲 MAGNET! (Attracts fireflies)', '#a855f7', 1500);
}

function grabDoublePoints() {
    doublePointsActive = true;
    doublePointsTimer = DOUBLE_POINTS_DURATION;
    flashStatus('⭐ 2× POINTS! (Double score)', '#ff6b9d', 1500);
}

function grabSlowMotion() {
    slowMotionActive = true;
    slowMotionTimer = SLOW_MOTION_DURATION;
    flashStatus('⏳ SLOW MOTION! (Obstacles slower)', '#50c878', 1500);
}

function grabMiniBat() {
    miniBatActive = true;
    miniBatTimer = MINI_BAT_DURATION;
    player.w = originalBatWidth * 0.5;
    player.h = originalBatHeight * 0.5;
    flashStatus('🔽 MINI BAT! (Smaller hitbox)', '#ff8c00', 1500);
}

function grabMultiShot() {
    multiShotActive = true;
    multiShotTimer = MULTI_SHOT_DURATION;
    flashStatus('🌈 MULTI-SHOT! (3 pings)', '#ff6bff', 1500);
}

function grabExtraLife() {
    if (extraLives >= MAX_EXTRA_LIVES) {
        flashStatus(`❤️ MAX LIVES! (${extraLives})`, '#ff4444', 1500);
        return;
    }
    extraLives++;
    flashStatus(`❤️ +1 LIFE! (${extraLives} total)`, '#ff4444', 1500);
}

const POWERUP_ACTIONS = {
    shield: grabShield,
    speed: grabSpeed,
    magnet: grabMagnet,
    doublepoints: grabDoublePoints,
    slowmotion: grabSlowMotion,
    minibat: grabMiniBat,
    multishot: grabMultiShot,
    extralife: grabExtraLife
};

function handlePlayerHit(hitX, hitY, sourceList, idx) {
    if (shieldActive) {
        shieldActive = false;
        shieldTimer = 0;
        burst(hitX, hitY, '#4a9eff', 20);
        sourceList.splice(idx, 1);
        flashStatus('🛡️ SHIELD BLOCKED!', '#4a9eff', 1000);
        return false;
    }

    if (extraLives > 0) {
        extraLives--;
        burst(hitX, hitY, '#ff4444', 20);
        sourceList.splice(idx, 1);
        flashStatus('❤️ LOST A LIFE! (' + extraLives + ' left)', '#ff4444', 1500);
        return false;
    }

    endGame();
    return true;
}

function killBoss() {
    bossActive = false;
    bossDefeated = true;
    bossDefeatedSound();
    burst(bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, '#ffd93d', 50);
    flashStatus('👑 BOSS DEFEATED!', '#ffd93d', 2500);
    sonarCooldownFrames = 300;
}

function startNewGame() {
    const cfg = DIFFICULTY[currentDifficulty];
    beeSpawnRate = cfg.beeSpawnRate;
    beeSpeed = cfg.beeSpeed;
    POWERUP_SPAWN_INTERVAL = cfg.powerupSpawnRate;

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

    showScore();
    refreshHighScore();

    statusSpan.textContent = '⏳ GET READY';
    statusSpan.style.color = '#ffd93d';

    stopBeat();
    pickupSound();
}

function endGame() {
    trySaveScore();

    gameActive = false;
    gameOver = true;

    statusSpan.textContent = '💀 GAME OVER - Press Enter';
    statusSpan.style.color = '#ff6b6b';

    deathSound();
    stopBeat();
    shakeScreen(10);
    burst(player.x + player.w/2, player.y + player.h/2, '#ff4757', 50);

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

function trySonar() {
    if (!gameActive || gameOver || sonarActive || sonarCooldown > 0) return;

    if (multiShotActive) {
        multiShotCount = 0;
        doMultiShot();
        return;
    }

    sonarActive = true;
    sonarTimer = SONAR_DURATION;

    const pan = (player.x / W - 0.5) * 0.8;
    sonarSound(pan);
    shakeScreen(3);
    burst(player.x + player.w/2, player.y + player.h/2, '#4a9eff', 15);
}

function doMultiShot() {
    if (multiShotCount >= 3 || !multiShotActive) return;

    sonarActive = true;
    sonarTimer = SONAR_DURATION;

    const pan = (player.x / W - 0.5) * 0.8 + (multiShotCount - 1) * 0.2;
    sonarSound(pan);
    shakeScreen(3);
    burst(player.x + player.w/2, player.y + player.h/2, '#ff6bff', 15);

    multiShotCount++;
    if (multiShotCount < 3) setTimeout(doMultiShot, 150);
}

function fadeParticles() {
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
        const t = trailParticles[i];
        t.x += t.vx;
        t.y += t.vy;
        t.life--;
        if (t.life <= 0) trailParticles.splice(i, 1);
    }
}

function update() {
    if (countdownActive) {
        fadeParticles();

        if (frameCount % 60 === 0) {
            countdown--;
            if (countdown <= 0) {
                countdownActive = false;
                gameActive = true;
                statusSpan.textContent = '🦇 ECHO ACTIVE';
                statusSpan.style.color = '#7bed9f';
                startBeat();
                pickupSound();
            }
        }
        frameCount++;
        return;
    }

    if (!gameActive || gameOver) {
        fadeParticles();
        return;
    }

    let spd = player.speed;
    if (speedBoostActive) spd = originalSpeed * 2;

    if (leftPressed && player.x > 0) player.x -= spd;
    if (rightPressed && player.x + player.w < W) player.x += spd;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    dropTrail(player.x, player.y);

    if (shieldActive && --shieldTimer <= 0) shieldActive = false;
    if (speedBoostActive) {
        speedBoostTimer--;
        if (speedBoostTimer <= 0) {
            speedBoostActive = false;
            player.speed = originalSpeed;
        }
    }
    if (magnetActive && --magnetTimer <= 0) magnetActive = false;
    if (doublePointsActive && --doublePointsTimer <= 0) doublePointsActive = false;
    if (slowMotionActive && --slowMotionTimer <= 0) slowMotionActive = false;
    if (miniBatActive) {
        miniBatTimer--;
        if (miniBatTimer <= 0) {
            miniBatActive = false;
            player.w = originalBatWidth;
            player.h = originalBatHeight;
        }
    }
    if (multiShotActive && --multiShotTimer <= 0) multiShotActive = false;

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
        if (Math.random() < 0.3) makePowerup();
        powerupSpawnTimer = 0;
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.speed;
        p.pulse += 0.05;

        if (hits(player, p)) {
            powerupSound();
            burst(p.x + p.w/2, p.y + p.h/2, p.color, 20);

            const applyEffect = POWERUP_ACTIONS[p.type];
            if (applyEffect) applyEffect();

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

                if (frameCount % 5 === 0) {
                    burst(ff.x + ff.w/2, ff.y + ff.h/2, 'rgba(168,85,247,0.3)', 1);
                }
            }
        }
    }

    for (let i = fireflies.length - 1; i >= 0; i--) {
        const ff = fireflies[i];
        ff.y += ff.speed;

        if (hits(player, ff)) {
            combo++;
            if (combo > maxCombo) maxCombo = combo;
            comboDisplayTimer = 60;

            let pts = 1 + Math.floor(score / 10);
            if (combo >= 5) pts += Math.floor(combo / 2);
            if (doublePointsActive) pts *= 2;

            score += pts;
            showScore();
            pickupSound();
            burst(ff.x + ff.w/2, ff.y + ff.h/2, '#2ed573', 30);
            shakeScreen(2);

            fireflies.splice(i, 1);
            continue;
        }

        if (ff.y > H + 20) fireflies.splice(i, 1);
    }

    if (score >= 150 && !bossActive && !bossDefeated && !gameOver && gameActive) {
        obstacles = [];

        bossActive = true;
        bossHealth = BOSS_MAX_HEALTH;
        bossX = W/2 - BOSS_SIZE/2;
        bossY = 40;
        bossAttackTimer = 0;
        bossProjectiles = [];

        sonarCooldownFrames = 180;

        flashStatus('👹 BOSS APPEARED! Defeat it!', '#ff4757', 2000);
        powerupSound();
    }

    if (!bossActive && !bossDefeated) {
        const rate = Math.max(12, beeSpawnRate - Math.floor(score / 6));

        if (frameCount % rate === 0) {
            if (Math.random() < 0.55) makeObstacle();
            else makeFirefly();
            if (score > 20 && Math.random() < 0.2) makeObstacle();
        }
    } else {
        const rate = Math.max(20, beeSpawnRate * 0.7);

        if (frameCount % rate === 0) {
            makeFirefly();
            if (Math.random() < 0.3) makeFirefly();
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obs.speed;

        if (hits(player, obs)) {
            const done = handlePlayerHit(obs.x + obs.w/2, obs.y + obs.h/2, obstacles, i);
            if (done) return;
            continue;
        }

        if (obs.y > H + 20) obstacles.splice(i, 1);
    }

    fadeParticles();

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

            bossProjectiles.push({
                x: bossX + BOSS_SIZE/2 - 6,
                y: bossY + BOSS_SIZE,
                vx: Math.cos(angle) * 4.0,
                vy: Math.sin(angle) * 4.0,
                size: 12,
                life: 120
            });
        }

        for (let i = bossProjectiles.length - 1; i >= 0; i--) {
            const p = bossProjectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (hits(player, { x: p.x - p.size/2, y: p.y - p.size/2, w: p.size, h: p.size })) {
                const done = handlePlayerHit(p.x, p.y, bossProjectiles, i);
                if (done) return;
                continue;
            }

            if (p.x < -20 || p.x > W + 20 || p.y > H + 20 || p.life <= 0) {
                bossProjectiles.splice(i, 1);
            }
        }

        if (sonarActive) {
            const dx = player.x + player.w/2 - bossX - BOSS_SIZE/2;
            const dy = player.y + player.h/2 - bossY - BOSS_SIZE/2;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 1000 && bossHealth > 0) {
                bossHealth--;
                burst(bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, '#ff6bff', 20);
                shakeScreen(5);
                bossHitSound();

                if (bossHealth <= 0) {
                    killBoss();
                } else {
                    flashStatus(`💥 BOSS HIT! (${bossHealth}/${BOSS_MAX_HEALTH} HP)`, '#ff6bff', 1500);
                }

                sonarActive = false;
            }
        }
    }

    if (frameCount % 100 === 0 && score > 5 && !bossActive && !bossDefeated) {
        if (Math.random() < 0.3) {
            makeObstacle();
            makeObstacle();
        }
    }

    frameCount++;
}

function draw() {
    ctx.save();
    updateScreenShake();
    ctx.translate(shakeX, shakeY);

    if (discoMode) {
        discoTimer--;
        discoHue = (discoHue + 2) % 360;

        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, `hsl(${discoHue}, 90%, 10%)`);
        grad.addColorStop(0.5, `hsl(${(discoHue + 60) % 360}, 90%, 15%)`);
        grad.addColorStop(1, `hsl(${(discoHue + 120) % 360}, 90%, 10%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const beamCount = 14;
        const beamW = 10;
        const swaySpeed = 0.04;
        const swayDist = 80;

        for (let i = 0; i < beamCount; i++) {
            const baseX = (i / beamCount) * W + beamW / 2;
            const phase = i * 0.7 + discoHue * 0.02;
            const offset = Math.sin(frameCount * swaySpeed + phase) * swayDist;
            const x = Math.max(0, Math.min(W - beamW, baseX + offset));

            const hue = (discoHue + i * 25) % 360;
            const alpha = 0.5 + 0.3 * Math.sin(frameCount * 0.04 + i * 0.5);

            const beamGrad = ctx.createLinearGradient(x, 0, x + beamW, H);
            beamGrad.addColorStop(0, `hsla(${hue}, 100%, 80%, ${alpha})`);
            beamGrad.addColorStop(0.4, `hsla(${(hue + 30) % 360}, 100%, 60%, ${alpha * 0.8})`);
            beamGrad.addColorStop(1, `hsla(${(hue + 60) % 360}, 100%, 40%, ${alpha * 0.4})`);

            ctx.fillStyle = beamGrad;
            ctx.fillRect(x, 0, beamW, H);

            ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.2)`;
            ctx.shadowBlur = 25;
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(x - 4, 0, beamW + 8, H);
            ctx.shadowBlur = 0;
        }

        if (frameCount % 3 === 0) {
            burst(Math.random() * W, Math.random() * H, `hsl(${Math.random() * 360},100%,70%)`, 3);
        }

        if (discoTimer <= 0) {
            discoMode = false;
            discoHue = 0;
        }
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

        for (let x = 0; x <= W; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y <= H; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }

    for (let ff of fireflies) {
        const grad = ctx.createRadialGradient(
            ff.x + ff.w/2, ff.y + ff.h/2, 2,
            ff.x + ff.w/2, ff.y + ff.h/2, ff.w * 1.2
        );

        const visible = sonarActive || ff.y < 100 || Math.sin(frameCount * 0.05 + ff.x) > 0.7;

        if (visible) {
            grad.addColorStop(0, `rgba(46,213,115,${0.8 + ff.glow * 0.2})`);
            grad.addColorStop(0.5, `rgba(46,213,115,${0.3 + ff.glow * 0.2})`);
            grad.addColorStop(1, 'rgba(46,213,115,0)');
        } else {
            grad.addColorStop(0, 'rgba(46,213,115,0.05)');
            grad.addColorStop(1, 'rgba(46,213,115,0)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(ff.x - ff.w * 0.5, ff.y - ff.h * 0.5, ff.w * 2, ff.h * 2);

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
            ctx.roundRect(ff.x + 3, ff.y + 3, ff.w - 6, ff.h - 6, 4);
            ctx.fill();

            ctx.fillStyle = 'rgba(46,213,115,0.3)';
            ctx.beginPath();
            ctx.arc(ff.x + ff.w/2, ff.y + ff.h/2, ff.w * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

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
                ctx.roundRect(obs.x + 4, obs.y + 4, obs.w - 8, obs.h - 8, 4);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = 'rgba(255,71,87,0.03)';
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }

        ctx.shadowBlur = 0;
    }

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

    if (sonarActive) {
        const flashAlpha = (sonarTimer / SONAR_DURATION) * 0.15;
        ctx.fillStyle = `rgba(74,158,255,${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);

        const ringRadius = (1 - sonarTimer / SONAR_DURATION) * 300;

        ctx.strokeStyle = `rgba(74,158,255,${0.3 * (sonarTimer / SONAR_DURATION)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.w/2, player.y + player.h/2, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(74,158,255,${0.15 * (sonarTimer / SONAR_DURATION)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(player.x + player.w/2, player.y + player.h/2, ringRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }

    for (let p of trailParticles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (bossActive) {
        const glowGrad = ctx.createRadialGradient(
            bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, 5,
            bossX + BOSS_SIZE/2, bossY + BOSS_SIZE/2, BOSS_SIZE * 1.8
        );
        glowGrad.addColorStop(0, 'rgba(255,0,0,0.4)');
        glowGrad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(bossX - BOSS_SIZE, bossY - BOSS_SIZE, BOSS_SIZE * 3, BOSS_SIZE * 3);

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
        ctx.arc(bossX + 16, bossY + 22, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bossX + BOSS_SIZE - 16, bossY + 22, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';

        ctx.beginPath();
        ctx.arc(bossX + 14, bossY + 20, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bossX + BOSS_SIZE - 18, bossY + 20, 3, 0, Math.PI * 2);
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

        const hpAbove = bossY - 16;
        const hpWidth = BOSS_SIZE * (bossHealth / BOSS_MAX_HEALTH);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bossX, hpAbove, BOSS_SIZE, 6);

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(bossX, hpAbove, hpWidth, 6);

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(bossX, hpAbove, BOSS_SIZE, 6);

        ctx.fillStyle = '#ff6666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('👹 BOSS', bossX + BOSS_SIZE/2, hpAbove - 4);

        for (let p of bossProjectiles) {
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ff3300';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size/4, 0, Math.PI * 2);
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
        ctx.fillText('No bonus - game continues', W/2, 170);

        if (frameCount % 3 === 0) {
            burst(Math.random() * W, 60 + Math.random() * 40, `hsl(${Math.random()*360},100%,70%)`, 2);
        }
    }

    let glowCol = '#4a9eff';
    let glowAmt = 30;

    if (shieldActive)       { glowCol = '#4a9eff'; glowAmt = 50; }
    if (speedBoostActive)   { glowCol = '#ffd93d'; glowAmt = 50; }
    if (magnetActive)       { glowCol = '#a855f7'; glowAmt = 50; }
    if (doublePointsActive) { glowCol = '#ff6b9d'; glowAmt = 50; }
    if (miniBatActive)      { glowCol = '#ff8c00'; glowAmt = 40; }
    if (multiShotActive)    { glowCol = '#ff6bff'; glowAmt = 50; }

    const pGlow = ctx.createRadialGradient(
        player.x + player.w/2, player.y + player.h/2, 5,
        player.x + player.w/2, player.y + player.h/2, player.w * 1.5
    );
    pGlow.addColorStop(0, `${glowCol}22`);
    pGlow.addColorStop(1, `${glowCol}00`);
    ctx.fillStyle = pGlow;
    ctx.fillRect(player.x - player.w, player.y - player.h, player.w * 3, player.h * 3);

    ctx.shadowColor = glowCol;
    ctx.shadowBlur = glowAmt;
    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 10);
    ctx.fill();

    if (shieldActive) {
        ctx.shadowBlur = 0;

        ctx.strokeStyle = `rgba(74,158,255,${0.3 + 0.3 * Math.sin(frameCount * 0.1)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(player.x - 6, player.y - 6, player.w + 12, player.h + 12, 14);
        ctx.stroke();

        ctx.strokeStyle = `rgba(74,158,255,${0.15 + 0.15 * Math.sin(frameCount * 0.1 + 1)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(player.x - 10, player.y - 10, player.w + 20, player.h + 20, 18);
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
    ctx.arc(player.x + 10, player.y + 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.w - 10, player.y + 14, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(player.x + 10 + (leftPressed ? -2 : 2), player.y + 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.w - 10 + (rightPressed ? 2 : -2), player.y + 15, 2.5, 0, Math.PI * 2);
    ctx.fill();

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

    if (gameActive && !gameOver) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(20, H - 25, 100, 6);

        ctx.fillStyle = sonarActive ? '#4a9eff' : 'rgba(74,158,255,0.3)';
        ctx.fillRect(20, H - 25, sonarActive ? 100 : 30, 6);

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '8px monospace';
        ctx.fillText('SONAR', 25, H - 15);

        if (sonarCooldown > 0) {
            const recharge = 1 - (sonarCooldown / sonarCooldownFrames);
            ctx.fillStyle = `rgba(255,200,100,${0.5 * recharge})`;
            ctx.fillRect(24, H - 13, 92 * recharge, 3);
        }
    }

    if (extraLives > 0) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '18px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('❤️ x' + extraLives, W - 10, 15);
    }

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

    const activeIcons = [];
    if (shieldActive)       activeIcons.push('🛡️');
    if (speedBoostActive)   activeIcons.push('⚡');
    if (magnetActive)       activeIcons.push('🧲');
    if (doublePointsActive) activeIcons.push('⭐');
    if (slowMotionActive)   activeIcons.push('⏳');
    if (miniBatActive)      activeIcons.push('🔽');
    if (multiShotActive)    activeIcons.push('🌈');

    if (activeIcons.length > 0) {
        ctx.fillStyle = '#ffffff88';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('✨ ' + activeIcons.join(' '), 15, 55);
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

CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
};

function tick() {
    update();
    draw();
    requestAnimationFrame(tick);
}

function onTitleScreen() {
    return !gameActive && !gameOver && !countdownActive;
}

function switchDifficulty(key) {
    const i = difficultyOptions.indexOf(currentDifficulty);
    const step = key === 'ArrowLeft' ? -1 : 1;
    currentDifficulty = difficultyOptions[(i + step + 3) % 3];
    highlightCurrentDiff();

    statusSpan.textContent = '🎯 ' + currentDifficulty;
    statusSpan.style.color = '#4a9eff';

    clearTimeout(window._diffTimeout);
    window._diffTimeout = setTimeout(() => {
        if (onTitleScreen()) {
            statusSpan.textContent = '▶ PRESS ENTER';
            statusSpan.style.color = '#ffd93d';
        }
    }, 1500);
}

function onKeyDown(e) {
    const key = e.key;

    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === ' ') {
        e.preventDefault();
        ensureAudio();
    }

    if (onTitleScreen() && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        switchDifficulty(key);
        return;
    }

    if (key === 'Enter') {
        if (gameOver || onTitleScreen()) {
            startNewGame();
            return;
        }
        if (gameActive && !gameOver) {
            trySonar();
            trackDiscoPress();
        }
        return;
    }

    if (gameActive && !gameOver) {
        if (key === 'ArrowLeft') leftPressed = true;
        else if (key === 'ArrowRight') rightPressed = true;
    }
}

function onKeyUp(e) {
    const key = e.key;

    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Enter' || key === ' ') {
        e.preventDefault();
    }

    if (key === 'ArrowLeft') leftPressed = false;
    if (key === 'ArrowRight') rightPressed = false;
}

window.addEventListener('blur', () => {
    leftPressed = false;
    rightPressed = false;
});
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

const touchLeft = document.getElementById('touchLeft');
const touchRight = document.getElementById('touchRight');
const touchEnter = document.getElementById('touchEnter');

if (touchLeft && touchRight && touchEnter) {
    let taps = 0;
    let lastTap = 0;

    function pressLeft(e) {
        e.preventDefault();
        leftPressed = true;
        touchLeft.classList.add('active-touch');
    }
    function releaseLeft(e) {
        e.preventDefault();
        leftPressed = false;
        touchLeft.classList.remove('active-touch');
    }
    touchLeft.addEventListener('touchstart', pressLeft);
    touchLeft.addEventListener('touchend', releaseLeft);
    touchLeft.addEventListener('touchcancel', releaseLeft);
    touchLeft.addEventListener('mousedown', pressLeft);
    touchLeft.addEventListener('mouseup', releaseLeft);
    touchLeft.addEventListener('mouseleave', releaseLeft);

    function pressRight(e) {
        e.preventDefault();
        rightPressed = true;
        touchRight.classList.add('active-touch');
    }
    function releaseRight(e) {
        e.preventDefault();
        rightPressed = false;
        touchRight.classList.remove('active-touch');
    }
    touchRight.addEventListener('touchstart', pressRight);
    touchRight.addEventListener('touchend', releaseRight);
    touchRight.addEventListener('touchcancel', releaseRight);
    touchRight.addEventListener('mousedown', pressRight);
    touchRight.addEventListener('mouseup', releaseRight);
    touchRight.addEventListener('mouseleave', releaseRight);

    function pressEnter(e) {
        e.preventDefault();
        touchEnter.classList.add('active-touch');

        const now = Date.now();
        if (now - lastTap < 500) taps++;
        else taps = 1;
        lastTap = now;

        if (taps >= 5) {
            enterPressCount = 5;
            trackDiscoPress();
            taps = 0;
            touchEnter.style.background = 'rgba(255,100,255,0.6)';
            touchEnter.style.borderColor = '#ff6bff';
            setTimeout(() => {
                touchEnter.style.background = '';
                touchEnter.style.borderColor = '';
                touchEnter.classList.remove('active-touch');
            }, 400);
            return;
        }

        if (gameActive && !gameOver && !countdownActive) trySonar();
        else if (gameOver || (!gameActive && !countdownActive)) startNewGame();
    }

    function releaseEnter(e) {
        e.preventDefault();
        touchEnter.classList.remove('active-touch');
        touchEnter.style.background = '';
        touchEnter.style.borderColor = '';
    }

    touchEnter.addEventListener('touchstart', pressEnter);
    touchEnter.addEventListener('touchend', releaseEnter);
    touchEnter.addEventListener('touchcancel', releaseEnter);
    touchEnter.addEventListener('mousedown', pressEnter);
    touchEnter.addEventListener('mouseup', releaseEnter);
    touchEnter.addEventListener('mouseleave', releaseEnter);
}

gameActive = false;
gameOver = false;
statusSpan.textContent = '▶ PRESS ENTER';
statusSpan.style.color = '#ffd93d';
refreshHighScore();

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

tick();

window.addEventListener('unload', () => {
    stopBeat();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
});

console.log('🦇 Echo Location ready');
console.log('← → move, Enter = sonar');
console.log('5× Enter = disco');
console.log('Boss shows up at 150. 10 hits to kill.');
