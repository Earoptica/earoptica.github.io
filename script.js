(() => {

  "use strict";


  let instances = [];


  const prefersReducedMotion =
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;



  /* ----------------------------------
     FONT SYSTEM
  ---------------------------------- */


  const FONT_MAP = {

    archivo: (size) =>
      `400 ${size}px "Archivo Black", Arial, sans-serif`,

    space: (size) =>
      `700 ${size}px "Space Grotesk", Arial, sans-serif`,

    condensed: (size) =>
      `900 ${size}px "Barlow Condensed", Arial, sans-serif`,

    inter: (size) =>
      `800 ${size}px "Inter", Arial, sans-serif`,

    mono: (size) =>
      `700 ${size}px "IBM Plex Mono", monospace`

  };



  /* ----------------------------------
     CLOSE OTHER SELECTED BANDS
  ---------------------------------- */


  function closeOtherBands(activeBand) {

    for (const band of instances) {

      if (band === activeBand) {
        continue;
      }

      band.pointer.pinned = false;

    }

  }



  /* ----------------------------------
     WAVE ALL BANDS ABOVE
  ---------------------------------- */


  function waveUpTo(activeBand, x, touch = false) {

    const activeIndex =
      activeBand.index;


    for (const band of instances) {


      /* ACTIVE BAND + EVERYTHING ABOVE */

      if (band.index <= activeIndex) {

        band.pointer.active = true;

        band.pointer.targetX = x;

        band.pointer.targetRadius =
          band.getTargetRadius(touch);

        band.pointer.targetLift =
          band.getTargetLift(touch);

      }


      /* EVERYTHING BELOW STAYS FLAT */

      else {

        if (!band.pointer.pinned) {

          band.pointer.active = false;

          band.pointer.targetRadius = 0;

          band.pointer.targetLift = 0;

        }

      }

    }

  }



  /* ----------------------------------
     REMOVE HOVER WAVE
  ---------------------------------- */


  function clearHoverWave() {

    for (const band of instances) {

      if (!band.pointer.pinned) {

        band.pointer.active = false;

        band.pointer.targetRadius = 0;

        band.pointer.targetLift = 0;

      }

    }

  }



  /* ==================================
     MOVING BAND
  ================================== */


  class MovingBand {


    constructor(el, index) {


      this.el = el;

      this.index = index;


      this.canvas =
        el.querySelector(".band-canvas");


      this.ctx =
        this.canvas.getContext(
          "2d",
          {
            alpha: true
          }
        );


      this.hit =
        el.querySelector(".band-hit");



      /* CONTENT */


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
        Number(
          el.dataset.speed || 30
        );


      this.direction =
        Number(
          el.dataset.direction || -1
        );



      /* CANVAS */


      this.w = 0;

      this.h = 0;


      this.dpr =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


      this.fontSize = 50;

      this.repeatWidth = 250;


      this.offset =
        Math.random() * 300;



      /* --------------------------------
         INVISIBLE SPHERE
      -------------------------------- */


      this.pointer = {

        x: 0,
        y: 0,

        targetX: 0,
        targetY: 0,

        radius: 0,
        targetRadius: 0,

        lift: 0,
        targetLift: 0,

        active: false,
        pinned: false

      };



      this.dragStart = null;

      this.maxDrag = 0;


      this.lastTime =
        performance.now();



      this.onResize =
        this.onResize.bind(this);


      this.onPointerEnter =
        this.onPointerEnter.bind(this);


      this.onPointerMove =
        this.onPointerMove.bind(this);


      this.onPointerLeave =
        this.onPointerLeave.bind(this);


      this.onPointerDown =
        this.onPointerDown.bind(this);


      this.onPointerUp =
        this.onPointerUp.bind(this);


      this.onClick =
        this.onClick.bind(this);



      this.bind();

      this.resize();

    }



    /* --------------------------------
       EVENTS
    ---------------------------------- */


    bind() {


      window.addEventListener(
        "resize",
        this.onResize,
        {
          passive: true
        }
      );


      this.hit.addEventListener(
        "pointerenter",
        this.onPointerEnter
      );


      this.hit.addEventListener(
        "pointermove",
        this.onPointerMove
      );


      this.hit.addEventListener(
        "pointerleave",
        this.onPointerLeave
      );


      this.hit.addEventListener(
        "pointerdown",
        this.onPointerDown
      );


      this.hit.addEventListener(
        "pointerup",
        this.onPointerUp
      );


      this.hit.addEventListener(
        "pointercancel",
        this.onPointerUp
      );


      this.hit.addEventListener(
        "click",
        this.onClick
      );

    }



    /* --------------------------------
       RESIZE
    ---------------------------------- */


    onResize() {

      this.resize();

    }



    resize() {


      const rect =
        this.el.getBoundingClientRect();


      this.w =
        Math.max(
          1,
          Math.floor(rect.width)
        );


      this.h =
        Math.max(
          1,
          Math.floor(rect.height)
        );


      this.dpr =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


      this.canvas.width =
        Math.floor(
          this.w * this.dpr
        );


      this.canvas.height =
        Math.floor(
          this.h * this.dpr
        );


      this.canvas.style.width =
        `${this.w}px`;


      this.canvas.style.height =
        `${this.h}px`;


      this.ctx.setTransform(
        this.dpr,
        0,
        0,
        this.dpr,
        0,
        0
      );


      this.fontSize =
        Math.max(

          32,

          Math.min(

            this.h * 0.68,

            this.w * 0.08

          )

        );


      this.updateTextMetrics();

    }



    /* --------------------------------
       FONT
    ---------------------------------- */


    getFont() {


      const fontFactory =
        FONT_MAP[this.fontKey]
        ||
        FONT_MAP.inter;


      return fontFactory(
        this.fontSize
      );

    }



    updateTextMetrics() {


      this.ctx.font =
        this.getFont();


      const separator =
        "     ·     ";


      this.unitText =
        `${this.label}${separator}`;


      this.repeatWidth =
        Math.max(

          130,

          this.ctx.measureText(
            this.unitText
          ).width

        );

    }



    /* --------------------------------
       POINTER POSITION
    ---------------------------------- */


    localPoint(event) {


      const rect =
        this.el.getBoundingClientRect();


      return {

        x:
          event.clientX
          -
          rect.left,

        y:
          event.clientY
          -
          rect.top

      };

    }



    /* --------------------------------
       POINTER ENTER
    ---------------------------------- */


    onPointerEnter(event) {


      if (
        event.pointerType === "touch"
      ) {
        return;
      }


      const p =
        this.localPoint(event);


      this.pointer.targetY =
        p.y;


      waveUpTo(
        this,
        p.x,
        false
      );

    }



    /* --------------------------------
       POINTER MOVE
    ---------------------------------- */


    onPointerMove(event) {


      const p =
        this.localPoint(event);


      this.pointer.targetY =
        p.y;



      /* TOUCH */


      if (
        event.pointerType === "touch"
      ) {


        if (this.dragStart) {


          const dx =
            p.x
            -
            this.dragStart.x;


          const dy =
            p.y
            -
            this.dragStart.y;


          this.maxDrag =
            Math.max(

              this.maxDrag,

              Math.hypot(
                dx,
                dy
              )

            );

        }


        if (
          this.pointer.active
          ||
          this.pointer.pinned
        ) {

          waveUpTo(
            this,
            p.x,
            true
          );

        }

      }


      /* DESKTOP */


      else {

        waveUpTo(
          this,
          p.x,
          false
        );

      }

    }



    /* --------------------------------
       POINTER LEAVE
    ---------------------------------- */


    onPointerLeave(event) {


      if (
        event.pointerType === "touch"
      ) {
        return;
      }


      clearHoverWave();

    }



    /* --------------------------------
       POINTER DOWN
    ---------------------------------- */


    onPointerDown(event) {


      const p =
        this.localPoint(event);


      this.pointer.targetX =
        p.x;


      this.pointer.targetY =
        p.y;


      if (
        event.pointerType === "touch"
        ||
        event.pointerType === "pen"
      ) {


        this.dragStart =
          p;


        this.maxDrag =
          0;


        waveUpTo(
          this,
          p.x,
          true
        );


        this.hit.setPointerCapture?.(
          event.pointerId
        );

      }

    }



    /* --------------------------------
       TOUCH RELEASE
    ---------------------------------- */


    onPointerUp(event) {


      if (
        event.pointerType !== "touch"
        &&
        event.pointerType !== "pen"
      ) {
        return;
      }


      const p =
        this.localPoint(event);


      const wasTap =
        this.maxDrag < 12;



      if (wasTap) {


        /* SECOND TAP = OPEN */


        if (
          this.pointer.pinned
          &&
          this.isExposedPoint(
            p.x,
            p.y
          )
        ) {


          this.navigate();

          return;

        }



        /* FIRST TAP = SELECT */


        closeOtherBands(this);


        this.pointer.pinned =
          true;


        waveUpTo(
          this,
          p.x,
          true
        );

      }


      else {


        this.pointer.pinned =
          false;


        clearHoverWave();

      }


      this.dragStart =
        null;


      this.maxDrag =
        0;

    }



    /* --------------------------------
       DESKTOP CLICK
    ---------------------------------- */


    onClick(event) {


      if (
        event.pointerType === "touch"
        ||
        event.pointerType === "pen"
      ) {


        event.preventDefault();

        return;

      }


      const p =
        this.localPoint(event);



      /* SECOND CLICK = ENTER */


      if (
        this.pointer.pinned
        &&
        this.isExposedPoint(
          p.x,
          p.y
        )
      ) {


        this.navigate();

        return;

      }



      /* FIRST CLICK = SELECT */


      closeOtherBands(this);


      this.pointer.pinned =
        true;


      waveUpTo(
        this,
        p.x,
        false
      );

    }



    /* --------------------------------
       NAVIGATION
    ---------------------------------- */


    navigate() {


      if (
        !this.href
        ||
        this.href === "#"
      ) {
        return;
      }


      window.location.href =
        this.href;

    }



    /* --------------------------------
       RADIUS
    ---------------------------------- */


    getTargetRadius(
      touch = false
    ) {


      const radius =
        Math.min(
          this.w * 0.22,
          210
        );


      if (touch) {


        return Math.max(
          90,
          radius * 0.82
        );

      }


      return Math.max(
        120,
        radius
      );

    }



    /* --------------------------------
       LIFT HEIGHT
    ---------------------------------- */


    getTargetLift(
      touch = false
    ) {


      const amount =
        touch
          ? this.h * 0.72
          : this.h * 0.75;


      return Math.max(

        42,

        Math.min(
          this.h * 0.82,
          amount
        )

      );

    }



    /* --------------------------------
       CURVE
    ---------------------------------- */


    liftAtX(x) {


      const radius =
        Math.max(
          1,
          this.pointer.radius
        );


      const distance =
        Math.abs(
          x
          -
          this.pointer.x
        );


      if (
        distance >= radius
      ) {
        return 0;
      }


      const t =
        distance
        /
        radius;


      const curve =
        0.5
        +
        0.5
        *
        Math.cos(
          Math.PI * t
        );


      return (

        this.pointer.lift

        *

        Math.pow(
          curve,
          1.55
        )

      );

    }



    /* --------------------------------
       CHECK EXPOSED AREA
    ---------------------------------- */


    isExposedPoint(x, y) {


      const lift =
        this.liftAtX(x);


      if (
        lift < 25
      ) {
        return false;
      }


      const exposedTop =
        this.h
        -
        lift;


      return (
        y >= exposedTop
      );

    }



    /* --------------------------------
       LATENCY
    ---------------------------------- */


    easePointer() {


      const movementLatency =
        0.13;


      const deformationLatency =
        0.11;


      this.pointer.x +=
        (
          this.pointer.targetX
          -
          this.pointer.x
        )
        *
        movementLatency;


      this.pointer.y +=
        (
          this.pointer.targetY
          -
          this.pointer.y
        )
        *
        movementLatency;


      this.pointer.radius +=
        (
          this.pointer.targetRadius
          -
          this.pointer.radius
        )
        *
        deformationLatency;


      this.pointer.lift +=
        (
          this.pointer.targetLift
          -
          this.pointer.lift
        )
        *
        deformationLatency;

    }



    /* --------------------------------
       UPDATE
    ---------------------------------- */


    update(now) {


      const deltaTime =
        Math.min(

          0.05,

          (
            now
            -
            this.lastTime
          )
          /
          1000

        );


      this.lastTime =
        now;


      if (
        !prefersReducedMotion
      ) {


        this.offset +=
          this.speed
          *
          this.direction
          *
          deltaTime;

      }


      if (
        this.repeatWidth > 0
      ) {


        this.offset %=
          this.repeatWidth;

      }


      this.easePointer();


      this.draw();

    }



    /* --------------------------------
       DRAW
    ---------------------------------- */


    draw() {


      const ctx =
        this.ctx;


      const width =
        this.w;


      const height =
        this.h;


      ctx.clearRect(
        0,
        0,
        width,
        height
      );


      const sliceWidth =
        4;


      const textY =
        height * 0.5;


      ctx.textAlign =
        "left";


      ctx.textBaseline =
        "middle";


      ctx.font =
        this.getFont();



      for (
        let x = 0;
        x < width;
        x += sliceWidth
      ) {


        const currentWidth =
          Math.min(
            sliceWidth + 1,
            width - x
          );


        const lift =
          this.liftAtX(
            x
            +
            currentWidth * 0.5
          );


        const y =
          -lift;


        ctx.save();


        ctx.beginPath();


        ctx.rect(
          x,
          0,
          currentWidth,
          height
        );


        ctx.clip();



        /* COLOR */


        ctx.fillStyle =
          this.background;


        ctx.fillRect(
          x,
          y,
          currentWidth,
          height + 2
        );



        /* TEXT */


        ctx.fillStyle =
          this.textColor;


        let start =
          this.offset
          -
          this.repeatWidth * 2;


        while (
          start > -this.repeatWidth
        ) {


          start -=
            this.repeatWidth;

        }


        while (
          start < -this.repeatWidth * 2
        ) {


          start +=
            this.repeatWidth;

        }


        for (
          let tx = start;
          tx < width + this.repeatWidth * 2;
          tx += this.repeatWidth
        ) {


          ctx.fillText(
            this.unitText,
            tx,
            textY + y
          );

        }


        ctx.restore();

      }

    }

  }



  /* ----------------------------------
     CREATE BANDS
  ---------------------------------- */


  const elements =
    [
      ...document.querySelectorAll(".band")
    ];


  instances =
    elements.map(

      (element, index) =>

        new MovingBand(
          element,
          index
        )

    );



  /* ----------------------------------
     WAIT FOR WEB FONTS
  ---------------------------------- */


  if (document.fonts) {


    document.fonts.ready.then(() => {


      for (
        const band of instances
      ) {


        band.resize();

      }

    });

  }



  /* ----------------------------------
     ANIMATION LOOP
  ---------------------------------- */


  function animate(now) {


    for (
      const band of instances
    ) {


      band.update(now);

    }


    requestAnimationFrame(
      animate
    );

  }


  requestAnimationFrame(
    animate
  );


})();
