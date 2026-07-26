const canvas = document.getElementById("pixel-world");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

window.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

function animate() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(mouseX - 15, mouseY - 15, 30, 30);

  requestAnimationFrame(animate);
}

animate();
