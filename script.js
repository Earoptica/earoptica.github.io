const canvas = document.getElementById("pixel-world");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let mouseX = -1000;
let mouseY = -1000;

const particles = [];

/*
  Pas deze waarden later aan:

  spacing:
  afstand tussen de pixels

  pixelSize:
  grootte van iedere pixel

  mouseRadius:
  gebied rond de muis waarin pixels bewegen
*/

const spacing = 32;
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

        x: x,
        y: y,

        velocityX: 0,
        velocityY: 0,

        driftOffset: Math.random() * Math.PI * 2,
        driftSpeed: 0.005 + Math.random() * 0.008
      });
    }
  }
}

function updateParticle(particle, time) {
  const dx = particle.x - mouseX;
  const dy = particle.y - mouseY;

  const distance = Math.sqrt(dx * dx + dy * dy);

  /*
    Pixels worden van de muis weggeduwd.
  */

  if (distance < mouseRadius && distance > 0) {
    const force = (mouseRadius - distance) / mouseRadius;
    const directionX = dx / distance;
    const directionY = dy / distance;

    particle.velocityX += directionX * force * 1.4;
    particle.velocityY += directionY * force * 1.4;
  }

  /*
    Zachte autonome pixel drift.
  */

  const driftX =
    Math.sin(time * particle.driftSpeed + particle.driftOffset) * 2;

  const driftY =
    Math.cos(time * particle.driftSpeed + particle.driftOffset) * 2;

  const targetX = particle.homeX + driftX;
  const targetY = particle.homeY + driftY;

  /*
    Pixels worden terug naar hun oorspronkelijke positie getrokken.
  */

  particle.velocityX += (targetX - particle.x) * 0.025;
  particle.velocityY += (targetY - particle.y) * 0.025;

  /*
    Wrijving voorkomt dat de pixels eindeloos blijven bewegen.
  */

  particle.velocityX *= 0.88;
  particle.velocityY *= 0.88;

  particle.x += particle.velocityX;
  particle.y += particle.velocityY;
}

function drawParticle(particle) {
  /*
    Posities worden afgerond zodat de beweging hoekig en pixelachtig blijft.
  */

  const x = Math.round(particle.x);
  const y = Math.round(particle.y);

  ctx.fillStyle = "rgba(48, 48, 48, 0.48)";
  ctx.fillRect(x, y, pixelSize, pixelSize);
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
