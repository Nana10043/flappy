const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const title = document.getElementById('title');
const hint = document.getElementById('hint');
const startBtn = document.getElementById('startBtn');

let state = 'menu';
let frameCount = 0;
let score = 0;
let bestScore = parseInt(localStorage.getItem('flappy_best')) || 0;
let animationId = null;

const bird = {
  x: 80, y: 280, w: 34, h: 24,
  vy: 0, gravity: 0.45, jump: -7.5,
  angle: 0, alive: true
};

let pipes = [];
const pipeW = 60;
const pipeGap = 150;
const pipeSpeed = 2.2;

const clouds = [
  { x: 60, y: 80, s: 0.6 },
  { x: 220, y: 50, s: 0.4 },
  { x: 340, y: 100, s: 0.5 },
  { x: 150, y: 140, s: 0.35 }
];

function reset() {
  bird.y = 280; bird.vy = 0; bird.angle = 0; bird.alive = true;
  pipes = [];
  score = 0; frameCount = 0;
}

function jump() {
  if (state === 'menu') { startGame(); return; }
  if (state === 'dead') return;
  bird.vy = bird.jump;
}

function startGame() {
  state = 'playing';
  reset();
  overlay.classList.add('hidden');
  if (animationId) cancelAnimationFrame(animationId);
  loop();
}

function gameOver() {
  state = 'dead';
  bird.alive = false;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappy_best', bestScore);
  }
  title.textContent = '\uD83D\uDC80 游戏结束';
  hint.innerHTML = '得分: <b>' + score + '</b> &nbsp; 最佳: <b>' + bestScore + '</b>';
  startBtn.textContent = '再来一次';
  startBtn.classList.remove('hidden');
  overlay.style.pointerEvents = 'auto';
}

function spawnPipe() {
  const minH = 60;
  const maxH = canvas.height - pipeGap - 60 - 80;
  const topH = minH + Math.random() * (maxH - minH);
  pipes.push({ x: canvas.width, topH: topH, passed: false });
}

function update() {
  frameCount++;
  bird.vy += bird.gravity;
  bird.y += bird.vy;
  bird.angle = Math.min(bird.vy * 4, 80);

  if (bird.y < 0) { bird.y = 0; bird.vy = 0; }

  if (bird.y + bird.h > canvas.height - 80) {
    bird.y = canvas.height - 80 - bird.h;
    gameOver();
  }

  if (frameCount % 100 === 0) spawnPipe();

  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= pipeSpeed;

    if (
      bird.x + bird.w > p.x + 4 &&
      bird.x < p.x + pipeW - 4 &&
      (bird.y < p.topH || bird.y + bird.h > p.topH + pipeGap)
    ) {
      gameOver();
    }

    if (!p.passed && p.x + pipeW < bird.x) {
      p.passed = true;
      score++;
    }

    if (p.x + pipeW < 0) pipes.splice(i, 1);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
  ctx.rotate((bird.angle * Math.PI) / 180);

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.w / 2, bird.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff9c4';
  ctx.beginPath();
  ctx.ellipse(2, 3, bird.w / 3, bird.h / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(8, -4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(9, -5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(22, 2);
  ctx.lineTo(14, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.ellipse(-4, 4, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPipes() {
  for (const p of pipes) {
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x, 0, pipeW, p.topH);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(p.x - 4, p.topH - 20, pipeW + 8, 20);
    const bottomY = p.topH + pipeGap;
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(p.x, bottomY, pipeW, canvas.height - bottomY - 80);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(p.x - 4, bottomY, pipeW + 8, 20);
  }
}

function drawGround() {
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  ctx.fillStyle = '#7CBA3D';
  ctx.fillRect(0, canvas.height - 80, canvas.width, 20);
  ctx.fillStyle = '#6BA82E';
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillRect(i, canvas.height - 60, 20, 6);
  }
}

function drawSky() {
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, '#87ceeb');
  grd.addColorStop(1, '#e8f4fd');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawClouds() {
  clouds.forEach(c => {
    c.x += 0.15;
    if (c.x > canvas.width + 60) c.x = -60;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 20 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 15 * c.s, c.y - 8 * c.s, 18 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 30 * c.s, c.y, 20 * c.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawScore() {
  if (state === 'playing' || state === 'dead') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillText(score, canvas.width / 2, 70);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
}

function loop() {
  if (state !== 'playing') return;
  update();
  drawSky();
  drawClouds();
  drawPipes();
  drawBird();
  drawGround();
  drawScore();
  animationId = requestAnimationFrame(loop);
}

function drawMenu() {
  drawSky();
  drawClouds();
  drawGround();
  bird.y = 280 + Math.sin(Date.now() / 300) * 8;
  drawBird();
  drawScore();
  animationId = requestAnimationFrame(drawMenu);
}
drawMenu();

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); jump(); } });

startBtn.addEventListener('click', startGame);

overlay.style.pointerEvents = 'auto';
