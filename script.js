(() => {
  "use strict";

  const canvas = document.getElementById("bands-canvas");
  const hitLayer = document.querySelector(".hit-layer");
  const hitBands = [...document.querySelectorAll(".band-hit")];

  if (!canvas || !hitLayer || !hitBands.length) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const FONT_MAP = {
    archivo: size =>
      `400 ${size}px "Archivo Black", Arial, sans-serif`,

    space: size =>
      `700 ${size}px "Space Grotesk", Arial, sans-serif`,

    condensed: size =>
      `900 ${size}px "Barlow Condensed", Arial, sans-serif`,

    inter: size =>
      `800 ${size}px "Inter", Arial, sans-serif`,

    mono: size =>
      `700 ${size}px "IBM Plex Mono", monospace`
  };


  /* ================================
     SETTINGS
  ================================ */

  const SLICE_WIDTH = 4;

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  let width = 1;
  let height = 1;
  let bandHeight = 1;
  let dpr = 1;

  let lastTime = performance.now();


  /* selected band */

  let selectedIndex = null;
  let selectedX = 0;
  let selectedTouch = false;


  /* click / touch */

  let dragStart = null;
  let maxDrag = 0;


  /* current wave */

  const wave = {
    index: null,
    x: 0,
    radius: 0,
    lift: 0
  };


  /* ================================
     BAND
  ================================ */

  class Band {

    constructor(el, index) {
      this.el = el;
      this.index = index;

      this.label =
        el.dataset.label || "EAROPTICA";

      this.href =
        el.dataset.href || "#";

      this.fontKey =
        el.dataset.font || "inter";

      this.background =
        el.dataset.bg || "#000000";

      this.textColor =
        el.dataset.text || "#ffffff";

      this.speed =
        Number(el.dataset.speed || 30);

      this.direction =
        Number(el.dataset.direction || -1);


      this.offset =
        Math.random() * 300;

      this.fontSize = 48;

      this.unitText =
        `${this.label}     ·     `;

      this.repeatWidth = 250;


      /*
      Each band has its own hidden
      flat canvas:

      colour + text together.
      */

      this.surface =
        document.createElement("canvas");

      this.surfaceCtx =
        this.surface.getContext(
          "2d",
          { alpha: false }
        );
    }


    getFont() {
      const factory =
        FONT_MAP[this.fontKey] ||
        FONT_MAP.inter;

      return factory(this.fontSize);
    }


    resize() {
      this.fontSize =
        Math.max(
          28,
          Math.min(
            bandHeight * 0.68,
            width * 0.08
          )
        );

      this.surface.width =
        Math.ceil(width * dpr);

      this.surface.height =
        Math.ceil((bandHeight + 4) * dpr);

      this.surfaceCtx.setTransform(
        dpr, 0, 0, dpr, 0, 0
      );

      this.surfaceCtx.font =
        this.getFont();

      this.repeatWidth =
        Math.max(
          130,
          this.surfaceCtx
            .measureText(this.unitText)
            .width
        );
    }


    update(dt) {
      if (!prefersReducedMotion) {
        this.offset +=
          this.speed *
          this.direction *
          dt;
      }

      if (this.repeatWidth > 0) {
        this.offset %= this.repeatWidth;
      }
    }


    render() {
      const sctx = this.surfaceCtx;
      const h = bandHeight + 4;

      /* colour */

      sctx.fillStyle =
        this.background;

      sctx.fillRect(
        0,
        0,
        width,
        h
      );


      /* text */

      sctx.font =
        this.getFont();

      sctx.fillStyle =
        this.textColor;

      sctx.textAlign =
        "left";

      sctx.textBaseline =
        "middle";


      let start =
        this.offset -
        this.repeatWidth * 2;


      while (
        start > -this.repeatWidth
      ) {
        start -= this.repeatWidth;
      }


      while (
        start < -this.repeatWidth * 2
      ) {
        start += this.repeatWidth;
      }


      for (
        let x = start;
        x < width + this.repeatWidth * 2;
        x += this.repeatWidth
      ) {
        sctx.fillText(
          this.unitText,
          x,
          bandHeight * 0.5
        );
      }
    }
  }


  const bands =
    hitBands.map(
      (el, index) =>
        new Band(el, index)
    );


  /* ================================
     SIZE
  ================================ */

  function resize() {
    const rect =
      hitLayer.getBoundingClientRect();

    width =
      Math.max(1, rect.width);

    height =
      Math.max(1, rect.height);

    bandHeight =
      height / bands.length;

    dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );


    canvas.width =
      Math.ceil(width * dpr);

    canvas.height =
      Math.ceil(height * dpr);

    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;


    ctx.setTransform(
      dpr, 0, 0, dpr, 0, 0
    );


    for (const band of bands) {
      band.resize();
    }
  }


  /* ================================
     POINTER
  ================================ */

  function localPoint(event) {
    const rect =
      hitLayer.getBoundingClientRect();

    return {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top
    };
  }


  function indexAtY(y) {
    return Math.max(
      0,
      Math.min(
        bands.length - 1,
        Math.floor(
          y / bandHeight
        )
      )
    );
  }


  /* ================================
     WAVE SIZE
  ================================ */

  function getRadius(touch = false) {
    const base =
      Math.min(
        width * 0.22,
        220
      );

    return touch
      ? Math.max(95, base * 0.84)
      : Math.max(125, base);
  }


  function getLift(touch = false) {
    const amount =
      touch
        ? bandHeight * 0.72
        : bandHeight * 0.76;

    return Math.max(
      42,
      Math.min(
        bandHeight * 0.84,
        amount
      )
    );
  }


  /* ================================
     STATIC WAVE

     No latency.
     Values change immediately.
  ================================ */

  function setWave(
    index,
    x,
    touch = false
  ) {
    wave.index = index;

    wave.x = x;

    wave.radius =
      getRadius(touch);

    wave.lift =
      getLift(touch);
  }


  function flattenWave() {
    wave.index = null;

    wave.radius = 0;

    wave.lift = 0;
  }


  function restoreSelectedWave() {
    if (selectedIndex === null) {
      flattenWave();
      return;
    }

    setWave(
      selectedIndex,
      selectedX,
      selectedTouch
    );
  }


  /* ================================
     CURVE
  ================================ */

  function waveAtX(x) {
    if (
      wave.index === null ||
      wave.radius <= 0
    ) {
      return 0;
    }


    const distance =
      Math.abs(
        x - wave.x
      );


    if (distance >= wave.radius) {
      return 0;
    }


    const t =
      distance / wave.radius;


    const curve =
      0.5 +
      0.5 *
      Math.cos(
        Math.PI * t
      );


    return (
      wave.lift *
      Math.pow(
        curve,
        1.55
      )
    );
  }


  /*
  IMPORTANT:

  Active band + every band above
  receive EXACTLY the same lift.

  So the stack behaves as one
  rigid set of layers.

  Bands below remain flat.
  */

  function translationForBand(
    index,
    x
  ) {
    if (
      wave.index === null ||
      index > wave.index
    ) {
      return 0;
    }

    return waveAtX(x);
  }


  /* ================================
     WHITE OPENING
  ================================ */

  function isExposedPoint(
    index,
    x,
    y
  ) {
    if (
      selectedIndex !== index ||
      wave.index !== index
    ) {
      return false;
    }


    const lift =
      translationForBand(
        index,
        x
      );


    if (lift < 22) {
      return false;
    }


    const bottom =
      (index + 1) *
      bandHeight;


    return (
      y >= bottom - lift &&
      y <= bottom
    );
  }


  /* ================================
     NAVIGATION
  ================================ */

  function navigate(index) {
    const href =
      bands[index]?.href;

    if (
      !href ||
      href === "#"
    ) {
      return;
    }

    window.location.href =
      href;
  }


  /* ================================
     DRAW BAND
  ================================ */

  function drawBand(band) {
    const baseTop =
      band.index *
      bandHeight;


    for (
      let x = 0;
      x < width;
      x += SLICE_WIDTH
    ) {
      const slice =
        Math.min(
          SLICE_WIDTH,
          width - x
        );


      const sampleX =
        x + slice * 0.5;


      const lift =
        translationForBand(
          band.index,
          sampleX
        );


      const top =
        baseTop - lift;


      const sourceX =
        Math.floor(
          x * dpr
        );


      const sourceWidth =
        Math.max(
          1,
          Math.ceil(
            slice * dpr
          )
        );


      /*
      Complete band surface is moved:

      background + typography together.
      */

      ctx.drawImage(
        band.surface,

        sourceX,
        0,
        sourceWidth,
        band.surface.height,

        x,
        top - 1,

        slice + 1.5,
        bandHeight + 3
      );
    }
  }


  /* ================================
     DRAW WHOLE SCREEN
  ================================ */

  function draw() {
    ctx.clearRect(
      0,
      0,
      width,
      height
    );


    /*
    First update flat band surfaces.
    */

    for (const band of bands) {
      band.render();
    }


    /*
    Then deform them.

    Top → bottom means lower bands
    naturally cover overlaps above.
    */

    for (const band of bands) {
      drawBand(band);
    }
  }


  /* ================================
     HOVER / DRAG
  ================================ */

  hitLayer.addEventListener(
    "pointermove",
    event => {
      const p =
        localPoint(event);

      const index =
        indexAtY(p.y);


      /* touch drag */

      if (
        event.pointerType === "touch" ||
        event.pointerType === "pen"
      ) {
        if (!dragStart) return;


        const dx =
          p.x - dragStart.x;

        const dy =
          p.y - dragStart.y;


        maxDrag =
          Math.max(
            maxDrag,
            Math.hypot(dx, dy)
          );


        setWave(
          index,
          p.x,
          true
        );

        return;
      }


      /* mouse hover */

      setWave(
        index,
        p.x,
        false
      );
    }
  );


  /* ================================
     POINTER LEAVE
  ================================ */

  hitLayer.addEventListener(
    "pointerleave",
    event => {
      if (
        event.pointerType === "touch" ||
        event.pointerType === "pen"
      ) {
        return;
      }

      restoreSelectedWave();
    }
  );


  /* ================================
     POINTER DOWN
  ================================ */

  hitLayer.addEventListener(
    "pointerdown",
    event => {
      const p =
        localPoint(event);

      const index =
        indexAtY(p.y);


      dragStart = {
        x: p.x,
        y: p.y,
        index
      };

      maxDrag = 0;


      if (
        event.pointerType === "touch" ||
        event.pointerType === "pen"
      ) {
        hitLayer
          .setPointerCapture?.(
            event.pointerId
          );

        setWave(
          index,
          p.x,
          true
        );
      }
    }
  );


  /* ================================
     POINTER UP

     click 1 = select
     click 2 = enter
  ================================ */

  hitLayer.addEventListener(
    "pointerup",
    event => {
      if (!dragStart) return;


      const p =
        localPoint(event);

      const index =
        indexAtY(p.y);


      const wasTap =
        maxDrag < 12;


      const isTouch =
        event.pointerType === "touch" ||
        event.pointerType === "pen";


      if (wasTap) {

        /* SECOND CLICK */

        if (
          isExposedPoint(
            index,
            p.x,
            p.y
          )
        ) {
          navigate(index);
        }


        /* FIRST CLICK */

        else {
          selectedIndex =
            index;

          selectedX =
            p.x;

          selectedTouch =
            isTouch;

          setWave(
            index,
            p.x,
            isTouch
          );
        }
      }


      else {
        restoreSelectedWave();
      }


      dragStart = null;

      maxDrag = 0;
    }
  );


  /* ================================
     CANCEL
  ================================ */

  hitLayer.addEventListener(
    "pointercancel",
    () => {
      dragStart = null;

      maxDrag = 0;

      restoreSelectedWave();
    }
  );


  /* ================================
     KEYBOARD
  ================================ */

  hitLayer.addEventListener(
    "keydown",
    event => {
      const hit =
        event.target.closest(
          ".band-hit"
        );

      if (!hit) return;


      const index =
        hitBands.indexOf(hit);

      if (index < 0) return;


      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();


        if (
          selectedIndex === index
        ) {
          navigate(index);
        }

        else {
          selectedIndex =
            index;

          selectedX =
            width * 0.5;

          selectedTouch =
            false;

          setWave(
            index,
            selectedX,
            false
          );
        }
      }
    }
  );


  /* ================================
     RESIZE
  ================================ */

  window.addEventListener(
    "resize",
    resize,
    { passive: true }
  );


  if (document.fonts) {
    document.fonts.ready.then(
      resize
    );
  }


  resize();


  /* ================================
     ANIMATION

     Only text needs animation now.

     Wave itself has NO animation.
  ================================ */

  function animate(now) {
    const dt =
      Math.min(
        0.05,
        Math.max(
          0,
          (now - lastTime) / 1000
        )
      );


    lastTime = now;


    for (const band of bands) {
      band.update(dt);
    }


    draw();


    requestAnimationFrame(
      animate
    );
  }


  requestAnimationFrame(
    animate
  );

})();
