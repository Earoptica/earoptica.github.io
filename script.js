(() => {

  "use strict";

  const bands = [...document.querySelectorAll(".band")];

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* -----------------------------------------
     COLORS
  ----------------------------------------- */

  const BAND_COLORS = [

    {
      background: "#ff0000",
      text: "#000000"
    },

    {
      background: "#0000ff",
      text: "#000000"
    },

    {
      background: "#ffff00",
      text: "#000000"
    },

    {
      background: "#000000",
      text: "#ffffff"
    },

    {
      background: "#ffffff",
      text: "#000000"
    },

    {
      background: "#00ff00",
      text: "#000000"
    }

  ];


  /* -----------------------------------------
     MODERN FONT VARIATIONS
  ----------------------------------------- */

  const FONT_MAP = {

    sans: (size) =>
      `800 ${size}px Arial, Helvetica, sans-serif`,

    serif: (size) =>
      `800 ${size}px Arial, Helvetica, sans-serif`,

    mono: (size) =>
      `700 ${size}px "Arial Narrow", Arial, Helvetica, sans-serif`,

    condensed: (size) =>
      `900 ${size}px "Arial Narrow", Arial, Helvetica, sans-serif`,

    wide: (size) =>
      `700 ${size}px "Trebuchet MS", Arial, Helvetica, sans-serif`,

    pixel: (size) =>
      `800 ${size}px Arial, Helvetica, sans-serif`

  };


  class MovingBand {

    constructor(el, index) {

      this.el = el;

      this.canvas =
        el.querySelector(".band-canvas");

      this.ctx =
        this.canvas.getContext(
          "2d",
          { alpha: true }
        );

      this.hit =
        el.querySelector(".band-hit");


      this.label =
        el.dataset.label || "EAROPTICA";

      this.fontKey =
        el.dataset.font || "sans";

      this.speed =
        Number(el.dataset.speed || 30);

      this.direction =
        Number(el.dataset.direction || -1);

      this.index = index;


      /* GET BAND COLOR */

      this.colors =
        BAND_COLORS[index % BAND_COLORS.length];


      this.dpr =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );


      this.w = 0;
      this.h = 0;

      this.fontSize = 64;

      this.repeatWidth = 300;

      this.offset =
        Math.random() * 200;


      /* -----------------------------------------
         INVISIBLE SPHERE
      ----------------------------------------- */

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
        pinned: false,

        pointerType: "mouse"

      };


      this.lastTime =
        performance.now();

      this.dragStart = null;
      this.maxDrag = 0;


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

      this.onResize =
        this.onResize.bind(this);


      this.bind();
      this.resize();

    }


    bind() {

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

      window.addEventListener(
        "resize",
        this.onResize,
        { passive: true }
      );

    }


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

          42,

          Math.min(

            this.h * 0.74,

            this.w * 0.095

          )

        );


      this.updateTextMetrics();

    }


    updateTextMetrics() {

      const ctx =
        this.ctx;

      ctx.font =
        this.getFont();


      const spacer =
        "     ·     ";


      this.unitText =
        `${this.label}${spacer}`;


      this.repeatWidth =
        Math.max(

          160,

          ctx.measureText(
            this.unitText
          ).width

        );

    }


    getFont() {

      const factory =

        FONT_MAP[this.fontKey]

        ||

        FONT_MAP.sans;


      return factory(
        this.fontSize
      );

    }


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


    onPointerEnter(event) {

      if (
        event.pointerType === "touch"
      ) {
        return;
      }


      const p =
        this.localPoint(event);


      this.pointer.pointerType =
        event.pointerType || "mouse";

      this.pointer.targetX =
        p.x;

      this.pointer.targetY =
        p.y;

      this.pointer.active =
        true;

      this.pointer.targetRadius =
        this.getTargetRadius();

      this.pointer.targetLift =
        this.getTargetLift();

    }


    onPointerMove(event) {

      const p =
        this.localPoint(event);


      this.pointer.pointerType =

        event.pointerType

        ||

        this.pointer.pointerType;


      this.pointer.targetX =
        p.x;

      this.pointer.targetY =
        p.y;


      if (
        event.pointerType === "touch"
      ) {

        if (this.dragStart) {

          const dx =
            p.x - this.dragStart.x;

          const dy =
            p.y - this.dragStart.y;

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

          this.pointer.targetRadius =
            this.getTargetRadius(true);

          this.pointer.targetLift =
            this.getTargetLift(true);

        }

      }

      else {

        this.pointer.active =
          true;

        this.pointer.targetRadius =
          this.getTargetRadius();

        this.pointer.targetLift =
          this.getTargetLift();

      }

    }


    onPointerLeave(event) {

      if (
        event.pointerType === "touch"
      ) {
        return;
      }


      this.pointer.active =
        false;


      if (
        !this.pointer.pinned
      ) {

        this.pointer.targetRadius =
          0;

        this.pointer.targetLift =
          0;

      }

    }


    onPointerDown(event) {

      const p =
        this.localPoint(event);


      this.pointer.pointerType =
        event.pointerType || "mouse";

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

        this.pointer.active =
          true;

        this.pointer.targetRadius =
          this.getTargetRadius(true);

        this.pointer.targetLift =
          this.getTargetLift(true);


        this.hit.setPointerCapture?.(
          event.pointerId
        );

      }

    }


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
        this.maxDrag < 10;


      if (wasTap) {

        const clickedLink =
          this.getExposedLinkAt(

            event.clientX,

            event.clientY,

            p.x,

            p.y

          );


        if (

          this.pointer.pinned

          &&

          clickedLink

        ) {

          clickedLink.click();

          this.dragStart =
            null;

          this.maxDrag =
            0;

          return;

        }


        this.pointer.pinned =
          true;

        this.pointer.active =
          true;

        this.pointer.targetX =
          p.x;

        this.pointer.targetY =
          p.y;

        this.pointer.targetRadius =
          this.getTargetRadius(true);

        this.pointer.targetLift =
          this.getTargetLift(true);

      }

      else {

        this.pointer.pinned =
          false;

        this.pointer.active =
          false;

        this.pointer.targetRadius =
          0;

        this.pointer.targetLift =
          0;

      }


      this.dragStart =
        null;

      this.maxDrag =
        0;

    }


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


      const link =
        this.getExposedLinkAt(

          event.clientX,

          event.clientY,

          p.x,

          p.y

        );


      if (link) {

        link.click();

      }

    }


    getTargetRadius(
      isTouch = false
    ) {

      const base =
        Math.min(

          this.w * 0.22,

          190

        );


      if (isTouch) {

        return Math.max(

          100,

          base * 0.85

        );

      }


      return Math.max(

        120,

        base

      );

    }


    getTargetLift(
      isTouch = false
    ) {

      const base =

        this.h

        *

        (
          isTouch
            ? 0.68
            : 0.72
        );


      return Math.min(

        this.h * 0.78,

        Math.max(
          54,
          base
        )

      );

    }


    liftAtX(x) {

      const radius =
        Math.max(

          1,

          this.pointer.radius

        );


      const dx =
        Math.abs(

          x
          -
          this.pointer.x

        );


      if (
        dx >= radius
      ) {

        return 0;

      }


      const t =
        dx / radius;


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
          1.65
        )

      );

    }


    getExposedLinkAt(

      clientX,

      clientY,

      localX,

      localY

    ) {

      const lift =
        this.liftAtX(
          localX
        );


      const exposedTop =
        this.h
        -
        lift;


      if (

        lift < 26

        ||

        localY < exposedTop

      ) {

        return null;

      }


      const stack =
        document.elementsFromPoint(

          clientX,

          clientY

        );


      return (

        stack.find(

          (node) =>

            node instanceof HTMLAnchorElement

            &&

            node.closest(".band-under")

        )

        ||

        null

      );

    }


    easePointer() {

      const follow =
        0.14;

      const shapeEase =
        0.12;


      this.pointer.x +=

        (
          this.pointer.targetX
          -
          this.pointer.x
        )

        *

        follow;


      this.pointer.y +=

        (
          this.pointer.targetY
          -
          this.pointer.y
        )

        *

        follow;


      this.pointer.radius +=

        (
          this.pointer.targetRadius
          -
          this.pointer.radius
        )

        *

        shapeEase;


      this.pointer.lift +=

        (
          this.pointer.targetLift
          -
          this.pointer.lift
        )

        *

        shapeEase;

    }


    update(now) {

      const dt =
        Math.min(

          0.05,

          (
            now
            -
            this.lastTime
          )

          /

          1000

          ||

          0

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

          dt;

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


    draw() {

      const ctx =
        this.ctx;

      const w =
        this.w;

      const h =
        this.h;


      ctx.clearRect(

        0,

        0,

        w,

        h

      );


      const slice =
        4;


      const textY =
        h * 0.5;


      ctx.textAlign =
        "left";

      ctx.textBaseline =
        "middle";

      ctx.font =
        this.getFont();


      for (

        let x = 0;

        x < w;

        x += slice

      ) {

        const sw =
          Math.min(

            slice + 1,

            w - x

          );


        const lift =
          this.liftAtX(

            x
            +
            sw * 0.5

          );


        const y =
          -lift;


        ctx.save();


        ctx.beginPath();


        ctx.rect(

          x,

          0,

          sw,

          h

        );


        ctx.clip();


        /* BAND COLOR */

        ctx.fillStyle =
          this.colors.background;


        ctx.fillRect(

          x,

          y,

          sw,

          h + 2

        );


        /* TEXT COLOR */

        ctx.fillStyle =
          this.colors.text;


        let start =

          this.offset

          -

          this.repeatWidth * 2;


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
          -this.repeatWidth * 2

        ) {

          start +=
            this.repeatWidth;

        }


        for (

          let tx = start;

          tx
          <
          w
          +
          this.repeatWidth * 2;

          tx +=
            this.repeatWidth

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


  const instances =

    bands.map(

      (band, index) =>

        new MovingBand(
          band,
          index
        )

    );


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
