(() => {

  "use strict";


  /* ----------------------------------
     BASIC ELEMENTS
  ---------------------------------- */


  const hitLayer =
    document.querySelector(
      ".hit-layer"
    );


  const canvas =
    document.getElementById(
      "bands-canvas"
    );


  if (
    !hitLayer
    ||
    !canvas
  ) {

    return;

  }


  const ctx =
    canvas.getContext(

      "2d",

      {
        alpha: true
      }

    );


  const hitBands =
    [
      ...document.querySelectorAll(
        ".band-hit"
      )
    ];



  const prefersReducedMotion =
    window
      .matchMedia(
        "(prefers-reduced-motion: reduce)"
      )
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
     SETTINGS
  ---------------------------------- */


  /*
  How strongly the pressure continues
  through each band above.

  1 = same strength everywhere
  0.5 = quickly becomes weaker
  */

  const LIFT_DECAY =
    1;



  /*
  Width of the vertical slices.

  Lower = smoother,
  but heavier to render.
  */

  const SLICE_WIDTH =
    4;



  /* ----------------------------------
     SCREEN STATE
  ---------------------------------- */


  let width =
    1;


  let height =
    1;


  let bandHeight =
    1;


  let dpr =
    1;


  let lastTime =
    performance.now();



  /* ----------------------------------
     SELECTION
  ---------------------------------- */


  let selectedIndex =
    null;


  let selectedX =
    0;


  let selectedTouch =
    false;



  /* ----------------------------------
     TOUCH / CLICK
  ---------------------------------- */


  let dragStart =
    null;


  let maxDrag =
    0;



  /* ----------------------------------
     ONE GLOBAL WAVE

     This is important.

     All bands now respond to the SAME
     pressure field.

     So they cannot drift out of sync.
  ---------------------------------- */


  const wave = {


    index:
      null,


    targetIndex:
      null,


    x:
      0,


    targetX:
      0,


    lift:
      0,


    targetLift:
      0,


    radius:
      0,


    targetRadius:
      0

  };



  /* ==================================
     BAND SURFACE
  ================================== */


  class BandSurface {


    constructor(
      el,
      index
    ) {


      this.el =
        el;


      this.index =
        index;



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



      /* TEXT SCROLL */


      this.offset =
        Math.random()
        *
        300;


      this.fontSize =
        48;


      this.repeatWidth =
        250;


      this.unitText =
        `${this.label}     ·     `;



      /*

      Every band gets its own hidden
      canvas.

      This is NOT shown directly.

      It is basically the original
      flat strip containing:

      colour + text.

      Then the full-screen canvas
      bends this complete image.

      */


      this.surface =
        document.createElement(
          "canvas"
        );


      this.surfaceCtx =
        this.surface.getContext(

          "2d",

          {
            alpha: false
          }

        );

    }



    /* ----------------------------------
       FONT
    ---------------------------------- */


    getFont() {


      const factory =

        FONT_MAP[
          this.fontKey
        ]

        ||

        FONT_MAP.inter;


      return factory(
        this.fontSize
      );

    }



    /* ----------------------------------
       RESIZE BAND SURFACE
    ---------------------------------- */


    resize() {


      this.fontSize =
        Math.max(

          28,

          Math.min(

            bandHeight
            *
            0.68,

            width
            *
            0.08

          )

        );



      this.surface.width =
        Math.ceil(

          width
          *
          dpr

        );


      this.surface.height =
        Math.ceil(

          (
            bandHeight
            +
            4
          )

          *

          dpr

        );



      this.surfaceCtx
        .setTransform(

          dpr,

          0,

          0,

          dpr,

          0,

          0

        );



      this.surfaceCtx.font =
        this.getFont();



      this.repeatWidth =
        Math.max(

          130,

          this.surfaceCtx
            .measureText(
              this.unitText
            )
            .width

        );

    }



    /* ----------------------------------
       TEXT MOVEMENT
    ---------------------------------- */


    update(dt) {


      if (
        !prefersReducedMotion
      ) {


        this.offset +=

          this.speed

          *

          this.direction

          *

          dt;

      }



      if (
        this.repeatWidth > 0
      ) {


        this.offset %=

          this.repeatWidth;

      }

    }



    /* ----------------------------------
       CREATE COMPLETE FLAT STRIP

       Colour and text are rendered
       together here.
    ---------------------------------- */


    renderSurface() {


      const sctx =
        this.surfaceCtx;


      const surfaceHeight =

        bandHeight
        +
        4;



      /* COLOUR */


      sctx.clearRect(

        0,

        0,

        width,

        surfaceHeight

      );


      sctx.fillStyle =
        this.background;


      sctx.fillRect(

        0,

        0,

        width,

        surfaceHeight

      );



      /* TEXT */


      sctx.font =
        this.getFont();


      sctx.fillStyle =
        this.textColor;


      sctx.textAlign =
        "left";


      sctx.textBaseline =
        "middle";



      let start =

        this.offset

        -

        this.repeatWidth
        *
        2;



      while (

        start

        >

        -this.repeatWidth

      ) {


        start -=
          this.repeatWidth;

      }



      while (

        start

        <

        -this.repeatWidth
        *
        2

      ) {


        start +=
          this.repeatWidth;

      }



      for (

        let tx = start;

        tx
        <
        width
        +
        this.repeatWidth
        *
        2;

        tx +=
          this.repeatWidth

      ) {


        sctx.fillText(

          this.unitText,

          tx,

          bandHeight
          *
          0.5

        );

      }

    }

  }



  /* ----------------------------------
     CREATE BANDS
  ---------------------------------- */


  const bands =

    hitBands.map(

      (
        element,
        index
      ) =>

        new BandSurface(

          element,

          index

        )

    );



  /* ==================================
     RESIZE
  ================================== */


  function resize() {


    const rect =
      hitLayer
        .getBoundingClientRect();



    width =
      Math.max(

        1,

        rect.width

      );


    height =
      Math.max(

        1,

        rect.height

      );


    bandHeight =

      height

      /

      Math.max(

        1,

        bands.length

      );



    dpr =
      Math.min(

        window.devicePixelRatio
        ||
        1,

        2

      );



    canvas.width =
      Math.ceil(

        width
        *
        dpr

      );


    canvas.height =
      Math.ceil(

        height
        *
        dpr

      );


    canvas.style.width =
      `${width}px`;


    canvas.style.height =
      `${height}px`;



    ctx.setTransform(

      dpr,

      0,

      0,

      dpr,

      0,

      0

    );



    for (
      const band of bands
    ) {


      band.resize();

    }



    if (
      selectedIndex !== null
    ) {


      selectedX =
        Math.min(

          selectedX,

          width

        );

    }

  }



  /* ==================================
     POINTER POSITION
  ================================== */


  function localPoint(event) {


    const rect =
      hitLayer
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



  function indexAtY(y) {


    return Math.max(

      0,

      Math.min(

        bands.length - 1,

        Math.floor(

          y
          /
          bandHeight

        )

      )

    );

  }



  /* ==================================
     WAVE SETTINGS
  ================================== */


  function targetRadius(
    touch = false
  ) {


    const base =
      Math.min(

        width
        *
        0.22,

        220

      );


    return touch

      ?

      Math.max(

        95,

        base
        *
        0.84

      )

      :

      Math.max(

        125,

        base

      );

  }



  function targetLift(
    touch = false
  ) {


    const amount =

      touch

        ?

      bandHeight
      *
      0.72

        :

      bandHeight
      *
      0.76;


    return Math.max(

      42,

      Math.min(

        bandHeight
        *
        0.84,

        amount

      )

    );

  }



  /* ----------------------------------
     ACTIVATE WAVE
  ---------------------------------- */


  function setWave(
    index,
    x,
    touch = false
  ) {


    wave.targetIndex =
      index;


    wave.index =
      index;


    wave.targetX =
      x;


    wave.targetRadius =
      targetRadius(
        touch
      );


    wave.targetLift =
      targetLift(
        touch
      );

  }



  /* ----------------------------------
     REMOVE WAVE
  ---------------------------------- */


function flattenWave() {

  wave.targetIndex = null;
  wave.index = null;

  wave.targetRadius = 0;
  wave.radius = 0;

  wave.targetLift = 0;
  wave.lift = 0;

}



  /* ----------------------------------
     RETURN TO SELECTED BAND
  ---------------------------------- */


  function restoreSelectedWave() {


    if (
      selectedIndex === null
    ) {


      flattenWave();

      return;

    }


    setWave(

      selectedIndex,

      selectedX,

      selectedTouch

    );

  }



  /* ==================================
     WAVE SHAPE
  ================================== */


  function waveProfileAtX(x) {


    if (

      wave.index === null

      ||

      wave.radius <= 0.5

      ||

      wave.lift <= 0.5

    ) {


      return 0;

    }



    const distance =
      Math.abs(

        x

        -

        wave.x

      );



    if (
      distance >= wave.radius
    ) {


      return 0;

    }



    const t =

      distance

      /

      wave.radius;



    const curve =

      0.5

      +

      0.5

      *

      Math.cos(

        Math.PI
        *
        t

      );



    return (

      wave.lift

      *

      Math.pow(

        curve,

        1.55

      )

    );

  }



  /* ----------------------------------
     HOW FAR DOES EACH BAND MOVE?
  ---------------------------------- */


  function translationForBand(
    index,
    x
  ) {


    /*
    Bands below the active band
    don't move.
    */


    if (

      wave.index === null

      ||

      index > wave.index

    ) {


      return 0;

    }



    const distanceUp =

      wave.index

      -

      index;



    /*

    Active band = full force.

    Every band above receives
    slightly less force.

    */


    return (

      waveProfileAtX(x)

      *

      Math.pow(

        LIFT_DECAY,

        distanceUp

      )

    );

  }



  /* ==================================
     CHECK WHITE REVEALED AREA
  ================================== */


  function isExposedPoint(
    index,
    x,
    y
  ) {


    if (

      selectedIndex !== index

      ||

      wave.index !== index

    ) {


      return false;

    }



    const lift =
      translationForBand(

        index,

        x

      );



    if (
      lift < 22
    ) {


      return false;

    }



    const baseBottom =

      (
        index + 1
      )

      *

      bandHeight;



    const liftedBottom =

      baseBottom

      -

      lift;



    return (

      y >= liftedBottom

      &&

      y <= baseBottom

    );

  }



  /* ==================================
     NAVIGATION
  ================================== */


  function navigate(index) {


    const href =
      bands[index]
        ?.href;


    if (

      !href

      ||

      href === "#"

    ) {


      return;

    }


    window.location.href =
      href;

  }



  /* ==================================
     LATENCY
  ================================== */


  function easeWave() {


    /*
    Keep the latency.

    Only the PHYSICAL WAVE
    is delayed.

    The actual strips and text
    remain one synchronized image.
    */


    const movementLatency =
      0.13;


    const shapeLatency =
      0.11;



    wave.x +=

      (
        wave.targetX

        -

        wave.x
      )

      *

      movementLatency;



    wave.radius +=

      (
        wave.targetRadius

        -

        wave.radius
      )

      *

      shapeLatency;



    wave.lift +=

      (
        wave.targetLift

        -

        wave.lift
      )

      *

      shapeLatency;



    if (

      wave.targetIndex === null

      &&

      wave.lift < 0.2

      &&

      wave.radius < 0.2

    ) {


      wave.index =
        null;


      wave.lift =
        0;


      wave.radius =
        0;

    }

  }



  /* ==================================
     DRAW ONE BAND
  ================================== */


  function drawBand(band) {


    const baseTop =

      band.index

      *

      bandHeight;



    /*

    Take the complete strip image
    and slice it vertically.

    Each slice moves upward
    according to the global wave.

    Colour + typography therefore
    ALWAYS remain together.

    */


    for (

      let x = 0;

      x < width;

      x += SLICE_WIDTH

    ) {


      const sw =
        Math.min(

          SLICE_WIDTH,

          width - x

        );



      const sampleX =

        x

        +

        sw * 0.5;



      const lift =
        translationForBand(

          band.index,

          sampleX

        );



      const top =

        baseTop

        -

        lift;



      /* SOURCE COORDINATES */


      const sourceX =
        Math.floor(

          x
          *
          dpr

        );


      const sourceW =
        Math.max(

          1,

          Math.ceil(

            sw
            *
            dpr

          )

        );


      const sourceH =
        band.surface.height;



      /*

      Small overlap horizontally
      and vertically removes
      pixel seams.

      */


      ctx.drawImage(

        band.surface,


        sourceX,

        0,

        sourceW,

        sourceH,


        x,

        top - 1,

        sw + 1.25,

        bandHeight + 3

      );

    }

  }



  /* ==================================
     DRAW WHOLE INTERFACE
  ================================== */


  function draw() {


    /*
    Transparent first.

    The white HTML information
    underneath can therefore appear
    inside the opening.
    */


    ctx.clearRect(

      0,

      0,

      width,

      height

    );



    /*
    First create all six complete
    flat colour/text strips.
    */


    for (
      const band of bands
    ) {


      band.renderSurface();

    }



    /*
    IMPORTANT:

    Draw top → bottom.

    A lower strip therefore covers
    the overlap with the strip above.

    This produces the physical
    pushing effect without gaps.
    */


    for (
      const band of bands
    ) {


      drawBand(
        band
      );

    }

  }



  /* ==================================
     POINTER MOVE
  ================================== */


  hitLayer.addEventListener(

    "pointermove",

    (event) => {


      const p =
        localPoint(event);


      const index =
        indexAtY(
          p.y
        );



      /* TOUCH DRAG */


      if (

        event.pointerType === "touch"

        ||

        event.pointerType === "pen"

      ) {


        if (
          !dragStart
        ) {


          return;

        }



        const dx =

          p.x

          -

          dragStart.x;



        const dy =

          p.y

          -

          dragStart.y;



        maxDrag =
          Math.max(

            maxDrag,

            Math.hypot(

              dx,

              dy

            )

          );



        setWave(

          index,

          p.x,

          true

        );


        return;

      }



      /* MOUSE */


      setWave(

        index,

        p.x,

        false

      );

    }

  );



  /* ==================================
     POINTER LEAVES SCREEN
  ================================== */


  hitLayer.addEventListener(

    "pointerleave",

    (event) => {


      if (

        event.pointerType === "touch"

        ||

        event.pointerType === "pen"

      ) {


        return;

      }



      restoreSelectedWave();

    }

  );



  /* ==================================
     POINTER DOWN
  ================================== */


  hitLayer.addEventListener(

    "pointerdown",

    (event) => {


      const p =
        localPoint(event);


      const index =
        indexAtY(
          p.y
        );



      dragStart = {


        x:
          p.x,


        y:
          p.y,


        index:
          index,


        pointerType:

          event.pointerType

          ||

          "mouse"

      };


      maxDrag =
        0;



      if (

        event.pointerType === "touch"

        ||

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



  /* ==================================
     POINTER UP
  ================================== */


  hitLayer.addEventListener(

    "pointerup",

    (event) => {


      if (
        !dragStart
      ) {


        return;

      }



      const p =
        localPoint(event);


      const index =
        indexAtY(
          p.y
        );


      const wasTap =
        maxDrag < 12;


      const isTouch =

        event.pointerType === "touch"

        ||

        event.pointerType === "pen";



      if (wasTap) {


        /* --------------------------------
           SECOND CLICK / TAP

           If the band is already selected
           and user clicks in white opening:
           ENTER PAGE
        -------------------------------- */


        if (

          isExposedPoint(

            index,

            p.x,

            p.y

          )

        ) {


          navigate(
            index
          );

        }



        /* --------------------------------
           FIRST CLICK / TAP

           Select the band.
        -------------------------------- */


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



      /* DRAG */


      else {


        restoreSelectedWave();

      }



      dragStart =
        null;


      maxDrag =
        0;

    }

  );



  /* ==================================
     CANCEL
  ================================== */


  hitLayer.addEventListener(

    "pointercancel",

    () => {


      dragStart =
        null;


      maxDrag =
        0;


      restoreSelectedWave();

    }

  );



  /* ==================================
     KEYBOARD
  ================================== */


  hitLayer.addEventListener(

    "keydown",

    (event) => {


      const hit =
        event.target.closest(
          ".band-hit"
        );


      if (
        !hit
      ) {


        return;

      }



      const index =
        hitBands.indexOf(
          hit
        );


      if (
        index < 0
      ) {


        return;

      }



      if (

        event.key === "Enter"

        ||

        event.key === " "

      ) {


        event.preventDefault();



        if (
          selectedIndex === index
        ) {


          navigate(
            index
          );

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



  /* ==================================
     RESIZE
  ================================== */


  window.addEventListener(

    "resize",

    resize,

    {
      passive: true
    }

  );



  /* ----------------------------------
     WAIT UNTIL FONTS EXIST
  ---------------------------------- */


  if (
    document.fonts
  ) {


    document.fonts
      .ready
      .then(
        resize
      );

  }



  resize();



  /* ==================================
     ANIMATION LOOP
  ================================== */


  function animate(now) {


    const dt =
      Math.min(

        0.05,

        Math.max(

          0,

          (
            now
            -
            lastTime
          )

          /

          1000

        )

      );


    lastTime =
      now;



    /* MOVE TEXT */


    for (
      const band of bands
    ) {


      band.update(
        dt
      );

    }



    /* MOVE WAVE WITH LATENCY */


    easeWave();



    /* DRAW EVERYTHING */


    draw();



    requestAnimationFrame(
      animate
    );

  }



  requestAnimationFrame(
    animate
  );


})();
