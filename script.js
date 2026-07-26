const canvas = document.getElementById("pixel-world");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let mouseX = -1000;
let mouseY = -1000;

const spacing = 20;
const pixelSize = 16;
const radius = 140;

const pixels = [];

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

  createPixels();
}

function createPixels() {
  pixels.length = 0;

  for (let x = 0; x < width + spacing; x += spacing) {
    for (let y = 0; y < height + spacing; y += spacing) {
      pixels.push({
        homeX: x,
        homeY: y,
        x: x,
        y: y,
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

  if (distance < radius && distance > 0) {
    const force = (radius - distance) / radius;

    pixel.vx += (dx / distance) * force * 2.2;
    pixel.vy += (dy / distance) * force * 2.2;
  }

  pixel.vx += (pixel.homeX - pixel.x) * 0.03;
  pixel.vy += (pixel.homeY - pixel.y) * 0.03;

  pixel.vx *= 0.88;
  pixel.vy *= 0.88;

  pixel.x += pixel.vx;
  pixel.y += pixel.vy;
}

function draw() {
  // zwarte onderlaag
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // witte kern rond muis
  if (mouseX > -500) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 45, 0, Math.PI * 2);
    ctx.fill();
  }

  // groene bovenlaag
  pixels.forEach((pixel) => {
    updatePixel(pixel);

    ctx.fillStyle = "#00ff00";
    ctx.fillRect(
      Math.round(pixel.x),
      Math.round(pixel.y),
      pixelSize,
      pixelSize
    );
  });

  requestAnimationFrame(draw);
}

window.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

window.addEventListener("mouseleave", () => {
  mouseX = -1000;
  mouseY = -1000;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
draw();
