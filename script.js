(() => {

  "use strict";


  let instances = [];

  let selectedBand = null;

  let hoverBand = null;


  const prefersReducedMotion =
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;



  /* ----------------------------------
     FONTS
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
     FLATTEN EVERYTHING
  ---------------------------------- */

  function flattenAll() {

    for (const band of instances) {

      band.mode = "flat";

      band.pushSource = null;

      band.pointer.active = false;

      band.pointer.targetRadius = 0;

      band.pointer.targetLift = 0;

    }

  }



  /* ----------------------------------
     STACKED PRESSURE WAVE
  ---------------------------------- */

  function createStackWave(
    activeBand,
    x,
    touch = false
  ) {

    const activeIndex =
      activeBand.index;


    for (const band of instances) {


      /* bands below active band */

      if (band.index > activeIndex) {

        band.mode = "flat";

        band.pushSource = null;

        band.pointer.active = false;

        band.pointer.targetRadius = 0;

        band.pointer.targetLift = 0;

        continue;

      }


      const distance =
        activeIndex - band.index;



      /* ACTIVE BAND */

      if (distance === 0) {

        band.mode = "active";

        band.pushSource = null;

        band.pointer.active = true;

        band.pointer.targetX = x;

        band.pointer.targetRadius =
          band.getTargetRadius(touch);

        band.pointer.targetLift =
          band.getTargetLift(touch);

        continue;

      }



      /* BANDS ABOVE */

      band.mode = "pushed";

      band.pointer.active = true;

      band.pointer.targetX = x;



      /*
      Pressure becomes weaker
      as it travels upward.
      */

      const liftDecay =
        Math.pow(
          0.76,
          distance
        );


      const radiusDecay =
        Math.pow(
          0.97,
          distance
        );


      band.pointer.targetRadius =
        band.getTargetRadius(touch)
        *
        radiusDecay;


      band.pointer.targetLift =
        band.getTargetLift(touch)
        *
        liftDecay;



      /*
      The band immediately underneath
      is the physical source pushing
      through this layer.
      */

      band.pushSource =
        instances[
          band.index + 1
        ]
        ||
        null;

    }

  }



  /* ----------------------------------
     RETURN TO SELECTED STATE
  ---------------------------------- */

  function restoreSelectedWave() {

    if (!selectedBand) {

      flattenAll();

      return;

    }


    createStackWave(

      selectedBand,

      selectedBand.selectedX,

      selectedBand.selectedTouch

    );

  }



  /* ==================================
     BAND CLASS
  ================================== */

  class MovingBand {


    constructor(el, index) {


      this.el = el;

      this.index = index;


      this.canvas =
        el.querySelector(
          ".band-canvas"
        );


      this.ctx =
        this.canvas.getContext(

          "2d",

          {
            alpha: true
          }

        );


      this.hit =
        el.querySelector(
          ".band-hit"
        );



      /* CONTENT */

      this.label =
        el.dataset.label
        ||
        "EAROPTICA";


      this.href =
        el.dataset.href
        ||
        "#";


      this.fontKey =
        el.dataset.font
        ||
        "inter";


      this.background =
        el.dataset.bg
        ||
        "#000000";


      this.textColor =
        el.dataset.text
        ||
        "#ffffff";


      this.speed =
        Number(
          el.dataset.speed
          ||
          30
        );


      this.direction =
        Number(
          el.dataset.direction
          ||
          -1
        );



      /* STATE */

      this.mode =
        "flat";


      this.pushSource =
        null;


      this.selectedX =
        0;


      this.selectedTouch =
        false;



      /* CANVAS */

      this.w = 0;

      this.h = 0;


      this.dpr =
        Math.min(

          window.devicePixelRatio || 1,

          2

        );


      this.fontSize =
        50;


      this.repeatWidth =
        250;


      this.offset =
        Math.random() * 300;



      /* PRESSURE POINT */

      this.pointer = {

        x: 0,

        y: 0,

        targetX: 0,

        targetY: 0,

        radius: 0,

        targetRadius: 0,

        lift: 0,

        targetLift: 0,

        active: false

      };


      this.dragStart =
        null;


      this.maxDrag =
        0;


      this.lastTime =
        performance.now();



      /* bind */

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



    /* ----------------------------------
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



    /* ----------------------------------
       RESIZE
    ---------------------------------- */

    onResize() {

      this.resize();

    }



    resize() {


      const rect =
        this.el
          .getBoundingClientRect();


      this.w =
        Math.max(

          1,

          Math.ceil(
            rect.width
          )

        );


      this.h =
        Math.max(

          1,

          Math.ceil(
            rect.height
          )

        );


      this.dpr =
        Math.min(

          window.devicePixelRatio || 1,

          2

        );


      this.canvas.width =
        Math.ceil(
          this.w * this.dpr
        );


      this.canvas.height =
        Math.ceil(
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



    /* ----------------------------------
       FONT
    ---------------------------------- */

    getFont() {


      const factory =
        FONT_MAP[this.fontKey]
        ||
        FONT_MAP.inter;


      return factory(
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



    /* ----------------------------------
       POINTER POSITION
    ---------------------------------- */

    localPoint(event) {


      const rect =
        this.el
          .getBoundingClientRect();


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



    /* ----------------------------------
       HOVER ENTER
    ---------------------------------- */

    onPointerEnter(event) {


      if (
        event.pointerType === "touch"
      ) {

        return;

      }


      const p =
        this.localPoint(event);


      hoverBand =
        this;


      createStackWave(

        this,

        p.x,

        false

      );

    }



    /* ----------------------------------
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


          createStackWave(

            this,

            p.x,

            true

          );

        }

      }


      /* MOUSE */

      else {


        hoverBand =
          this;


        createStackWave(

          this,

          p.x,

          false

        );

      }

    }



    /* ----------------------------------
       LEAVE
    ---------------------------------- */

    onPointerLeave(event) {


      if (
        event.pointerType === "touch"
      ) {

        return;

      }


      if (
        hoverBand === this
      ) {

        hoverBand =
          null;

      }


      restoreSelectedWave();

    }



    /* ----------------------------------
       TOUCH START
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


        createStackWave(

          this,

          p.x,

          true

        );


        this.hit
          .setPointerCapture?.(
            event.pointerId
          );

      }

    }



    /* ----------------------------------
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

          selectedBand === this

          &&

          this.mode === "active"

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

        selectedBand =
          this;


        this.selectedX =
          p.x;


        this.selectedTouch =
          true;


        createStackWave(

          this,

          p.x,

          true

        );

      }


      else {


        restoreSelectedWave();

      }


      this.dragStart =
        null;


      this.maxDrag =
        0;

    }



    /* ----------------------------------
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



      /* SECOND CLICK = OPEN */

      if (

        selectedBand === this

        &&

        this.mode === "active"

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

      selectedBand =
        this;


      this.selectedX =
        p.x;


      this.selectedTouch =
        false;


      createStackWave(

        this,

        p.x,

        false

      );

    }



    /* ----------------------------------
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



    /* ----------------------------------
       WAVE SIZE
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



    getTargetLift(
      touch = false
    ) {


      const amount =

        touch

          ?

        this.h * 0.72

          :

        this.h * 0.75;


      return Math.max(

        42,

        Math.min(

          this.h * 0.82,

          amount

        )

      );

    }



    /* ----------------------------------
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
        distance / radius;


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



    /* ----------------------------------
       ACTIVE UNDER-LAYER
    ---------------------------------- */

    isExposedPoint(x, y) {


      if (
        this.mode !== "active"
      ) {

        return false;

      }


      const lift =
        this.liftAtX(x);


      if (
        lift < 25
      ) {

        return false;

      }


      return (
        y >= this.h - lift
      );

    }



    /* ----------------------------------
       LATENCY
    ---------------------------------- */

    easePointer() {


      /*
      This latency stays.

      It affects the physical wave,
      not the scrolling phase.
      */

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



    /* ----------------------------------
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



      /* TEXT SCROLL */

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



    /* ----------------------------------
       DRAW REPEATED TEXT

       Uses the SOURCE band's own
       offset, font, direction and speed.
    ---------------------------------- */

    drawRepeatedText(
      ctx,
      source,
      y
    ) {


      ctx.font =
        source.getFont();


      ctx.fillStyle =
        source.textColor;


      ctx.textAlign =
        "left";


      ctx.textBaseline =
        "middle";


      let start =

        source.offset

        -

        source.repeatWidth * 2;



      while (
        start > -source.repeatWidth
      ) {


        start -=
          source.repeatWidth;

      }



      while (
        start < -source.repeatWidth * 2
      ) {


        start +=
          source.repeatWidth;

      }



      for (

        let tx = start;

        tx <
        this.w
        +
        source.repeatWidth * 2;

        tx +=
          source.repeatWidth

      ) {


        ctx.fillText(

          source.unitText,

          tx,

          y

        );

      }

    }



    /* ----------------------------------
       DRAW SOURCE BAND THROUGH GAP

       IMPORTANT:

       This calculates where the lower
       band ACTUALLY is right now.

       So its text and colour remain
       physically synchronized.
    ---------------------------------- */

    drawSourceThroughGap(
      ctx,
      source,
      x,
      currentWidth
    ) {


      /*
      Use the source band's own
      current eased deformation.

      Not this band's deformation.
      */

      const sourceLift =
        source.liftAtX(

          x
          +
          currentWidth * 0.5

        );



      /*
      Imagine the source band is directly
      below this canvas.

      Its normal top edge would begin
      at y = this.h.

      When it moves upward by sourceLift:

      top = this.h - sourceLift
      */

      const sourceTop =
        this.h
        -
        sourceLift;



      /*
      Fill the lower band's colour from
      its true current top edge downward.
      */

      ctx.fillStyle =
        source.background;


      ctx.fillRect(

        x,

        sourceTop - 2,

        currentWidth,

        source.h + 4

      );



      /*
      Same physical calculation
      for its typography.

      Original centre of lower band:

      this.h + source.h / 2

      Then subtract its ACTUAL lift.
      */

      const sourceTextY =

        this.h

        +

        source.h * 0.5

        -

        sourceLift;



      this.drawRepeatedText(

        ctx,

        source,

        sourceTextY

      );

    }



    /* ----------------------------------
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



      /*
      Slight overlap between slices
      prevents pixel seams.
      */

      const sliceWidth =
        3;


      const ownTextY =
        height * 0.5;



      for (

        let x = 0;

        x < width;

        x += sliceWidth

      ) {


        const currentWidth =
          Math.min(

            sliceWidth + 2,

            width - x + 1

          );



        const ownLift =
          this.liftAtX(

            x

            +

            sliceWidth * 0.5

          );



        const ownY =
          -ownLift;



        ctx.save();



        /* slice clipping */

        ctx.beginPath();


        ctx.rect(

          x,

          0,

          currentWidth,

          height + 2

        );


        ctx.clip();



        /* --------------------------------
           PUSHED LAYER

           Draw exact physical state
           of band below.
        -------------------------------- */

        if (

          this.mode === "pushed"

          &&

          this.pushSource

        ) {


          this.drawSourceThroughGap(

            ctx,

            this.pushSource,

            x,

            currentWidth

          );

        }



        /* --------------------------------
           OWN COLOURED SURFACE
        -------------------------------- */

        ctx.fillStyle =
          this.background;


        ctx.fillRect(

          x,

          ownY,

          currentWidth,

          height + 3

        );



        /* --------------------------------
           OWN TEXT

           Moves together with its
           physical surface.
        -------------------------------- */

        this.drawRepeatedText(

          ctx,

          this,

          ownTextY + ownY

        );


        ctx.restore();

      }

    }

  }



  /* ----------------------------------
     CREATE BANDS
  ---------------------------------- */

  const elements =
    [
      ...document.querySelectorAll(
        ".band"
      )
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
     ANIMATION
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
