const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const speedEl = document.getElementById("speed");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const touchButtons = document.querySelectorAll(".ctrl");

const GRID_SIZE = 20;
const CELL = canvas.width / GRID_SIZE;
const BASE_INTERVAL = 160;
const MIN_INTERVAL = 70;
const STORAGE_KEY = "snake-best-score";

const DIR_MAP = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake;
let direction;
let nextDirection;
let food;
let score;
let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let gameOver;
let started;
let paused;
let loopId;

bestScoreEl.textContent = String(bestScore);

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  gameOver = false;
  started = false;
  paused = false;
  placeFood();
  updateHUD();
  setStatus("按任意方向键开始");
  draw();
  startLoop();
}

function placeFood() {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!snake.some((part) => part.x === candidate.x && part.y === candidate.y)) {
      food = candidate;
      return;
    }
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function getSpeedLevel() {
  return 1 + Math.floor(score / 5);
}

function getInterval() {
  return Math.max(MIN_INTERVAL, BASE_INTERVAL - (getSpeedLevel() - 1) * 10);
}

function updateHUD() {
  scoreEl.textContent = String(score);
  speedEl.textContent = String(getSpeedLevel());
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
  }
  bestScoreEl.textContent = String(bestScore);
}

function startLoop() {
  clearInterval(loopId);
  loopId = setInterval(tick, getInterval());
}

function willHitSelf(newHead, willGrow) {
  const body = willGrow ? snake : snake.slice(0, -1);
  return body.some((part) => part.x === newHead.x && part.y === newHead.y);
}

function tick() {
  if (gameOver || paused || !started) {
    return;
  }

  direction = nextDirection;
  const head = snake[0];
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };
  const willGrow = newHead.x === food.x && newHead.y === food.y;

  const hitWall =
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y >= GRID_SIZE;
  const hitSelf = willHitSelf(newHead, willGrow);

  if (hitWall || hitSelf) {
    gameOver = true;
    setStatus("游戏结束！按回车或点击按钮重新开始");
    draw();
    return;
  }

  snake.unshift(newHead);

  if (willGrow) {
    score += 1;
    placeFood();
    updateHUD();
    startLoop();
  } else {
    snake.pop();
  }

  draw();
}

function drawRect(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRect(food.x, food.y, "#f97316");

  snake.forEach((part, index) => {
    drawRect(part.x, part.y, index === 0 ? "#84cc16" : "#22c55e");
  });

  if (gameOver) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.7)";
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("游戏结束", canvas.width / 2, canvas.height / 2 + 10);
  } else if (paused) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
    ctx.fillRect(0, canvas.height / 2 - 36, canvas.width, 72);
    ctx.fillStyle = "#dbeafe";
    ctx.font = "700 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("已暂停", canvas.width / 2, canvas.height / 2 + 8);
  }
}

function setDirection(newDir) {
  if (gameOver) return;

  const opposite = direction.x === -newDir.x && direction.y === -newDir.y;
  if (opposite) return;

  nextDirection = newDir;
  if (!started) {
    started = true;
    setStatus("游戏进行中...");
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") {
    setDirection(DIR_MAP.up);
  } else if (key === "arrowdown" || key === "s") {
    setDirection(DIR_MAP.down);
  } else if (key === "arrowleft" || key === "a") {
    setDirection(DIR_MAP.left);
  } else if (key === "arrowright" || key === "d") {
    setDirection(DIR_MAP.right);
  } else if (key === " ") {
    if (!gameOver && started) {
      paused = !paused;
      setStatus(paused ? "游戏已暂停（按空格继续）" : "游戏进行中...");
      draw();
    }
  } else if (key === "enter") {
    resetGame();
  }
});

touchButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const dir = btn.dataset.dir;
    if (DIR_MAP[dir]) {
      setDirection(DIR_MAP[dir]);
    }
  });
});

restartBtn.addEventListener("click", resetGame);

resetGame();
