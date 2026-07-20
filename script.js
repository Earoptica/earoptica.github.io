const canvas = document.getElementById("pixel-world");
const context = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let mouseX = width / 2;
let mouseY = height / 2;

const pixelSize = 8;
const ballCount = 12;

const balls = [];

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
}

function randomVelocity() {
  const speed = 0.6 + Math.random() * 1.2;
  return Math.random() > 0.5 ? speed : -speed;
}

function createBall() {
  return {
    x: Math.random() * width,
    y: Math.random() * height,

    vx: randomVelocity(),
    vy: randomVelocity(),

    size: pixelSize * (1 + Math.floor(Math.random() * 2))
  };
}

for (let index = 0; index < ballCount; index += 1) {
  balls.push(createBall());
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("pointermove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

function updateBall(ball) {
  const deltaX = ball.x - mouseX;
  const deltaY = ball.y - mouseY;

  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  const interactionRadius = 170;
  const radiusSquared = interactionRadius * interactionRadius;

  if (distanceSquared < radiusSquared && distanceSquared > 1) {
    const distance = Math.sqrt(distanceSquared);
    const force = (interactionRadius - distance) / interactionRadius;

    ball.vx += (deltaX / distance) * force * 0.08;
    ball.vy += (deltaY / distance) * force * 0.08;
  }

  const maximumSpeed = 2.8;

  ball.vx = Math.max(-maximumSpeed, Math.min(maximumSpeed, ball.vx));
  ball.vy = Math.max(-maximumSpeed, Math.min(maximumSpeed, ball.vy));

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x <= 0 || ball.x + ball.size >= width) {
    ball.vx *= -1;
    ball.x = Math.max(0, Math.min(width - ball.size, ball.x));
  }

  if (ball.y <= 0 || ball.y + ball.size >= height) {
    ball.vy *= -1;
    ball.y = Math.max(0, Math.min(height - ball.size, ball.y));
  }
}

function drawPixelGrid() {
  context.fillStyle = "rgba(48, 48, 48, 0.045)";

  for (let x = 0; x < width; x += 32) {
    for (let y = 0; y < height; y += 32) {
      context.fillRect(x, y, 2, 2);
    }
  }
}

function drawBall(ball) {
  const snappedX = Math.round(ball.x / pixelSize) * pixelSize;
  const snappedY = Math.round(ball.y / pixelSize) * pixelSize;

  context.fillStyle = "rgba(48, 48, 48, 0.62)";
  context.fillRect(snappedX, snappedY, ball.size, ball.size);
}

function animate() {
  context.clearRect(0, 0, width, height);

  drawPixelGrid();

  balls.forEach((ball) => {
    updateBall(ball);
    drawBall(ball);
  });

  window.requestAnimationFrame(animate);
}

resizeCanvas();
animate();
