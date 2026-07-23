// ELEMEN DOM
const turtle = document.getElementById('turtle');
const gameContainer = document.getElementById('game-container');
const wasteContainer = document.getElementById('waste-container');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives-board');
const timerDisplay = document.getElementById('timer');

const gameOverScreen = document.getElementById('game-over-screen');
const gameStatusTitle = document.getElementById('game-status-title');
const submitBtn = document.getElementById('submit-score-btn');
const playerNameInput = document.getElementById('player-name');

// 🔴 URL WEB APP GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLs9xzHd-xYBk2ei9-mTAhORetJXtqJBI46WmKdeYgIcrzUGPSt9dFTrv4GK_WeNAo/exec';

// VARIABEL PERMAINAN
let score = 0;
let lives = 3;
let timeLeft = 60;
const maxScore = 100;

let isGameOver = false;
let isFrame1 = true;
let isSlowed = false;

let gameTimerInterval = null;
let spawnInterval = null;
let animationFrameId = null; // Pemasa untuk mematikan animation frame asal

// KEDUDUKAN PENYU & SKRIN
const containerWidth = 380;
let containerHeight = gameContainer.clientHeight || 650;

let turtleX = containerWidth / 2 - 35;
let turtleY = containerHeight - 120;
const normalSpeed = 6;
const slowSpeed = 2;
let currentSpeed = normalSpeed;

const keysPressed = {};

/* SENARAI ITEM DENGAN OBJEK KAPAL (IMPAK NYAWA) */
const itemsConfig = [
    { name: 'botol', src: 'assets/botol.png', points: 10, type: 'score' },
    { name: 'jaring', src: 'assets/pastik.png', points: 30, type: 'slow' },
    { name: 'tong', src: 'assets/sampah.png', points: 50, type: 'score' },
    { name: 'obor', src: 'assets/obor.png', points: -10, type: 'penalty' },
    { name: 'sealion', src: 'assets/sealion.png', points: -20, type: 'penalty' },
    { name: 'kapal', src: 'assets/kapal.png', points: 0, type: 'damage' }
];

// 1. ANIMASI SIRIP
setInterval(() => {
    if (!isGameOver) {
        turtle.src = isFrame1 ? 'assets/penyu2.png' : 'assets/penyu.png';
        isFrame1 = !isFrame1;
    }
}, 300);

// 2. PEMASA
function startTimer() {
    gameTimerInterval = setInterval(() => {
        if (isGameOver) return;

        timeLeft -= 1;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            endGame('time');
        }
    }, 1000);
}

// 3. KAWALAN KEYBOARD
document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;

    // Menghalang hantar skor automatik jika pengguna sedang menaip di dalam input nama
    if (e.code === 'Space' && isGameOver && document.activeElement !== playerNameInput) {
        submitScore();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

function updateTurtlePosition() {
    if (isGameOver) return;

    containerHeight = gameContainer.clientHeight || 650; // Kemaskini ketinggian
    currentSpeed = isSlowed ? slowSpeed : normalSpeed;

    if (keysPressed['a'] || keysPressed['arrowleft']) {
        if (turtleX > 0) turtleX -= currentSpeed;
    }
    if (keysPressed['d'] || keysPressed['arrowright']) {
        if (turtleX < containerWidth - 70) turtleX += currentSpeed;
    }
    if (keysPressed['w'] || keysPressed['arrowup']) {
        if (turtleY > 40) turtleY -= currentSpeed;
    }
    if (keysPressed['s'] || keysPressed['arrowdown']) {
        if (turtleY < containerHeight - 80) turtleY += currentSpeed;
    }

    turtle.style.left = `${turtleX}px`;
    turtle.style.top = `${turtleY}px`;

    animationFrameId = requestAnimationFrame(updateTurtlePosition);
}

// 4. JANA ITEM JATUH
function spawnItem() {
    if (isGameOver) return;

    const randomItemConfig = itemsConfig[Math.floor(Math.random() * itemsConfig.length)];

    const item = document.createElement('img');
    item.src = randomItemConfig.src;
    item.classList.add('trash');

    const randomX = Math.random() * (containerWidth - 40);
    item.style.left = `${randomX}px`;
    item.style.top = `-40px`;

    wasteContainer.appendChild(item);

    let itemY = -40;
    const speed = 2.5 + Math.random() * 2.5;

    const fallInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(fallInterval);
            item.remove();
            return;
        }

        itemY += speed;
        item.style.top = `${itemY}px`;

        const turtleRect = turtle.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        if (
            itemRect.left < turtleRect.right &&
            itemRect.right > turtleRect.left &&
            itemRect.top < turtleRect.bottom &&
            itemRect.bottom > turtleRect.top
        ) {
            clearInterval(fallInterval);
            item.remove();
            handleCollision(randomItemConfig);
        }

        if (itemY > containerHeight) {
            clearInterval(fallInterval);
            item.remove();
        }
    }, 20);
}

// 5. PERLANGGARAN
function handleCollision(item) {
    if (item.type === 'score' || item.type === 'penalty') {
        score += item.points;
        if (score < 0) score = 0;
        scoreDisplay.textContent = score;

        if (score >= maxScore) {
            score = maxScore;
            scoreDisplay.textContent = score;
            endGame('score_win');
        }

    } else if (item.type === 'slow') {
        score += item.points;
        scoreDisplay.textContent = score;

        isSlowed = true;
        turtle.style.filter = 'drop-shadow(0 0 8px #70a1ff)';
        setTimeout(() => {
            isSlowed = false;
            turtle.style.filter = 'none';
        }, 3000);

        if (score >= maxScore) {
            score = maxScore;
            scoreDisplay.textContent = score;
            endGame('score_win');
        }

    } else if (item.type === 'damage') {
        lives -= 1;
        updateLivesUI();
        if (lives <= 0) endGame('game_over');
    }
}

function updateLivesUI() {
    let hearts = '';
    for (let i = 0; i < lives; i++) hearts += '❤️';
    livesDisplay.textContent = hearts;
}

// 6. END GAME
function endGame(reason) {
    isGameOver = true;
    clearInterval(spawnInterval);
    clearInterval(gameTimerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId); // Hentikan loop penyu

    if (reason === 'score_win') {
        gameStatusTitle.textContent = "TAHNIAH! 🏆";
    } else if (reason === 'time') {
        gameStatusTitle.textContent = "MASA TAMAT ⏳";
    } else {
        gameStatusTitle.textContent = "GAME OVER ❌";
    }

    gameOverScreen.classList.remove('hidden');
    playerNameInput.focus();
}

// 7. FUNGSI HANTAR DATA KE GOOGLE SHEETS
function submitScore() {
    const name = playerNameInput.value.trim() || 'Pemain';

    const payload = {
        nama_pelajar: name,
        skor_akhir: score,
        baki_masa: timeLeft
    };

    submitBtn.textContent = "MENGHANTAR... ⏳";
    submitBtn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        alert(`Berjaya! Skor ${score} untuk ${name} (Baki masa: ${timeLeft}s) telah dihantar!`);
        submitBtn.textContent = "HANTAR SKOR 🚀";
        submitBtn.disabled = false;
        startGame();
    })
    .catch((error) => {
        console.error('Ralat:', error);
        alert('Gagal menghantar data. Sila cuba lagi!');
        submitBtn.textContent = "HANTAR SKOR 🚀";
        submitBtn.disabled = false;
    });
}

// 8. MULA GAME
function startGame() {
    score = 0;
    lives = 3;
    timeLeft = 60;
    isGameOver = false;

    // Padam animation frame lama jika ada
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    containerHeight = gameContainer.clientHeight || 650;
    turtleX = containerWidth / 2 - 35;
    turtleY = containerHeight - 120;

    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;
    updateLivesUI();

    wasteContainer.innerHTML = '';
    playerNameInput.value = '';
    gameOverScreen.classList.add('hidden');

    clearInterval(spawnInterval);
    clearInterval(gameTimerInterval);

    spawnInterval = setInterval(spawnItem, 1200);
    startTimer();
    updateTurtlePosition();
}

submitBtn.addEventListener('click', submitScore);

// Mula permainan pertama kali
startGame();