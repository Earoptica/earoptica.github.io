const canvas = document.getElementById("pixel-world");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let mouseX = -1000;
let mouseY = -1000;

const particles = [];

const spacing = 28;
const pixelSize = 5;
const mouseRadius = 150;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = false;

  createParticles();
}

function createParticles() {
  particles.length = 0;

  for (let x = 0; x <= width + spacing; x += spacing) {
    for (let y = 0; y <= height + spacing; y += spacing) {
      particles.push({
        homeX: x,
        homeY: y,
        x,
        y,
        velocityX: 0,
        velocityY: 0,
        offset: Math.random() * Math.PI * 2
      });
    }
  }
}

function updateParticle(particle, time) {
  const dx = particle.x - mouseX;
  const dy = particle.y - mouseY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < mouseRadius && distance > 0) {
    const force = (mouseRadius - distance) / mouseRadius;

    particle.velocityX += (dx / distance) * force * 1.25;
    particle.velocityY += (dy / distance) * force * 1.25;
  }

  const driftX = Math.sin(time * 0.001 + particle.offset) * 1.5;
  const driftY = Math.cos(time * 0.001 + particle.offset) * 1.5;

  const targetX = particle.homeX + driftX;
  const targetY = particle.homeY + driftY;

  particle.velocityX += (targetX - particle.x) * 0.03;
  particle.velocityY += (targetY - particle.y) * 0.03;

  particle.velocityX *= 0.86;
  particle.velocityY *= 0.86;

  particle.x += particle.velocityX;
  particle.y += particle.velocityY;
}

function drawParticle(particle) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";

  ctx.fillRect(
    Math.round(particle.x),
    Math.round(particle.y),
    pixelSize,
    pixelSize
  );
}

function animate(time) {
  ctx.clearRect(0, 0, width, height);

  particles.forEach((particle) => {
    updateParticle(particle, time);
    drawParticle(particle);
  });

  requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

window.addEventListener("pointerleave", () => {
  mouseX = -1000;
  mouseY = -1000;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
requestAnimationFrame(animate);
