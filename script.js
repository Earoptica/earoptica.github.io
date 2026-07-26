const canvas = document.getElementById("pixel-world");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let mouseX = -9999;
let mouseY = -9999;

const pixels = [];

const spacing = 18;
const pixelSize = 14;
const mouseRadius = 150;
const whiteRadius = 55;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = false;

  createPixels();
}

function createPixels() {
  pixels.length = 0;

  for (let x = 0; x < width + spacing; x += spacing) {
    for (let y = 0; y < height + spacing; y += spacing) {
      pixels.push({
        homeX: x,
        homeY: y,
        x,
        y,
        vx: 0,
        vy: 0
      });
    }
  }
}

function updatePixel(pixel) {
  const dx = pixel.x - mouseX;
  const dy = pixel.y - mouseY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < mouseRadius && distance > 0) {
    const force = (mouseRadius - distance) / mouseRadius;

    pixel.vx += (dx / distance) * force * 1.8;
    pixel.vy += (dy / distance) * force * 1.8;
  }

  pixel.vx += (pixel.homeX - pixel.x) * 0.025;
  pixel.vy += (pixel.homeY - pixel.y) * 0.025;

  pixel.vx *= 0.88;
  pixel.vy *= 0.88;

  pixel.x += pixel.vx;
  pixel.y += pixel.vy;
}

function drawBackgroundLayers() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    mouseX,
    mouseY,
    0,
    mouseX,
    mouseY,
    whiteRadius
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(
    mouseX - whiteRadius,
    mouseY - whiteRadius,
    whiteRadius * 2,
    whiteRadius * 2
  );
}

function drawPixel(pixel) {
  ctx.fillStyle = "#00ff00";

  ctx.fillRect(
    Math.round(pixel.x),
    Math.round(pixel.y),
    pixelSize,
    pixelSize
  );
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  drawBackgroundLayers();

  pixels.forEach((pixel) => {
    updatePixel(pixel);
    drawPixel(pixel);
  });

  requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

window.addEventListener("pointerleave", () => {
  mouseX = -9999;
  mouseY = -9999;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
animate();
