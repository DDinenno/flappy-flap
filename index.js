// Welcome to the Plexxis Code Challenge!
//
// The game you have to make (starting with this started code) is: Flappy Bird.
//
// PLEASE NOTE:
// * using Phaser, or some other JS game engine or off-the-shelf layers of abstraction is not allowed. yes, it would be easier if you had something like that.
// * no NPM libraries
// * the primary goal is to get you using the Canvas rendering and builting JS functionality directly
// * feel free to build your own layers of abstraction if you like
//
// The screen/canvas size is 1280 x 720 pixels.
// All art assets are provided for you.
// There are 3 scene layer images which repeat seamlessly on the left and right, for paralax scrolling: layer0, layer1, layer2, layer3
// There are 2 bird images (2 frames of animation)
// There is one pipe image. It is drawn with a negative y-axis scale to flip it.
//
// Most of the stuff in this file is just boiler plate stuff to get you going.
// The place where you want to begin tinkering, and hook in your code, is "mainDrawFunction".
//
// You will need to figure out input (flap button), physics of motion for the bird, collision detection (bird vs pipes, and bird vs ground), and scoring (one point per pipe passed without dieing).
// * For the collision detection, I would use a circle around the bird's body, rectangles around the pipes, and a rectangle for the ground.
// * So, you need to figure out how to test for overlap between a circle and rectangle. That's basically it.

const DEBUG = false;

// Attempts to load all of the images, and sets the load status to "done" if all succeeded, or "failed" otherwise.
const loadImages = async (images, app) => {
  app.image._counter = 0;
  app.image._error = false;
  const completionLogic = () => {
    app.image._counter++;
    if (app.image._counter >= Object.keys(images).length) {
      app.loadStatus = app.image._error ? "failed" : "done";
    }
  };

  for (const imageName of Object.keys(images)) {
    const img = new Image();
    img.addEventListener("load", () => {
      app.image[imageName] = img;
      completionLogic();
    });
    img.addEventListener("error", () => {
      console.log(`Error loading image: ${src}`);
      app.image._error = true;
      completionLogic();
    });
    img.src = images[imageName];
  }
};

const clamp = (val, min = -Infinity, max = Infinity) =>
  Math.min(Math.max(val, min), max);

// Wraps the "mainDrawFunction" in a try/catch and waits for all assets to load before allowing
// the mainDrawFunction to be called. Also wraps mainDrawFunction in a ctx.save() and .restore()
// to ensure consistency between frames.
const drawFunctionSafetyWrapper = (app) => {
  try {
    app.ctx.save(); // save the sate of the graphics context.

    if (app.loadStatus === "loading") {
      app.ctx.fillStyle = "white";
      app.ctx.fillRect(0, 0, app.canvasRef.width, app.canvasRef.height);
      app.ctx.fillStyle = "black";
      app.ctx.font = "48px arial";
      app.ctx.fillText("Loading images ...", 20, 100);
    } else if (app.loadStatus === "failed") {
      app.ctx.fillStyle = "white";
      app.ctx.fillRect(0, 0, app.canvasRef.width, app.canvasRef.height);
      app.ctx.fillStyle = "black";
      app.ctx.font = "48px arial";
      app.ctx.fillText("One or more images failed to load :-(", 20, 100);
    } else if (app.gameOver) {
      mainDrawFunction(app);
      app.ctx.fillStyle = "red";
      app.ctx.textAlign = "center";
      app.ctx.fillText(
        "Game Over",
        app.canvasRef.width / 2,
        app.canvasRef.height / 2
      );

      app.ctx.fillStyle = "black";
      app.ctx.textAlign = "center";
      app.ctx.fillText(
        "( Press Space to restart )",
        app.canvasRef.width / 2,
        app.canvasRef.height / 2 + 100
      );
    } else {
      mainDrawFunction(app);
      app.frameCounter++;
    }

    app.ctx.restore(); // restore the state of the graphics context. This way we know whatever we have done to its state, it is now undone.
  } catch (e) {
    console.log(
      `WARNING: your mainDrawFunction threw an uncaught exception:\n  ${e.message}`
    );
  }

  window.requestAnimationFrame(() => {
    drawFunctionSafetyWrapper(app);
  });
};

// draw a full-screen seamless tiling image at the specified offset
const drawBackgroundAtOffset = (ctx, img, offset) => {
  // asumes:
  // * img is the full size of the canvas, in pixels
  // * img seamlessly tiles on teh left and right
  const off = offset % img.width;
  if (off === 0) {
    drawImage(ctx, img, 0, 0);
  } else {
    drawImage(ctx, img, -off, 0);
    drawImage(ctx, img, -off + img.width, 0);
  }
};

// draw an image at the specified position
const drawImage = (ctx, img, x, y, angleDeg) => {
  ctx.save();

  if (angleDeg) {
    ctx.translate(x + img.width / 2, y + img.height / 2);
    ctx.rotate(((2.0 * Math.PI) / 360.0) * angleDeg);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  } else {
    ctx.drawImage(img, x, y);
  }

  ctx.restore();
};

// draw an image at the specified position, with the specified scale applied to each axis
const drawImageScaled = (ctx, img, x, y, scaleX, scaleY) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
};

// draw an image centered at the specified position, and rotated by the specified angle in degrees
const drawImageCentered = (ctx, img, x, y, angleDeg = 0) => {
  ctx.save();
  const halfWidth = Math.abs(img.width * 0.5);
  const halfHeight = Math.abs(img.height * 0.5);
  ctx.translate(x, y);
  ctx.rotate(((2.0 * Math.PI) / 360.0) * angleDeg); // convert degrees to radians.
  ctx.translate(-halfWidth, -halfHeight);
  ctx.drawImage(img, 0, 0);

  ctx.restore();
};

const isCircleCollidingWithRect = (aX, aY, aW, aH, bX, bY, bW, bH) => {
  const radius = aW / 2;
  const aCX = aX + radius;
  const aCY = aY + radius;

  const bCX = bX + bW / 2;
  const bCY = bY + bH / 2;

  const closestX = Math.max(bCX - bW / 2, Math.min(aCX, bCX + bW / 2));
  const closestY = Math.max(bCY - bH / 2, Math.min(aCY, bCY + bH / 2));

  const dist = Math.sqrt(
    Math.pow(closestX - aCX, 2) + Math.pow(closestY - aCY, 2)
  );
  if (dist <= radius) {
    return true;
  }
};

class Collider {
  gameObject = null;

  static colliders = [];

  onCollissionListeners = [];

  isColliding() {
    const collided = !!Collider.colliders.find((col) => {
      if (col.gameObject === this.gameObject) return;

      const aX = this.gameObject.position.x;
      const aY = this.gameObject.position.y;
      const aW = this.gameObject.width;
      const aH = this.gameObject.height;

      const bX = col.gameObject.position.x;
      const bY = col.gameObject.position.y;
      const bW = col.gameObject.width;
      const bH = col.gameObject.height;

      if (this.gameObject.circular && !col.gameObject.circular) {
        return isCircleCollidingWithRect(aX, aY, aW, aH, bX, bY, bW, bH);
      } else if (col.gameObject.circular && !this.gameObject.circular) {
        return isCircleCollidingWithRect(bX, bY, bW, bH, aX, aY, aW, aH);
      } else {
        const overlapX =
          (aX <= bX + bW && aX >= bX) ||
          (aX + aW >= bX && aX + aW <= bX + bW) ||
          (aX >= bX && aX + aW <= bX + bW);
        const overlapY =
          (aY <= bY + bH && aY >= bY) ||
          (aY + aH >= bY && aY + aH <= bY + bH) ||
          (aY >= bY && aY + aH <= bY + bH);

        if (overlapX && overlapY) return true;
      }

      return false;
    });

    if (collided) this.onCollissionListeners.forEach((cb) => cb());

    return collided;
  }

  constructor(go, onCollision) {
    this.gameObject = go;

    if (onCollision) this.onCollissionListeners.push(onCollision);

    Collider.colliders.push(this);

    this.gameObject.onRender((ctx) => {
      if (go.image == null) return;

      ctx.fillStyle = this.isColliding() ? "#f32f32A1" : "#fc7f03A1";

      if (DEBUG) {
        if (go.circular) {
          ctx.beginPath();
          ctx.arc(
            go.position.x + go.width / 2,
            go.position.y + go.width / 2,
            go.width / 2,
            0,
            2 * Math.PI
          );
          ctx.fill();
        } else {
          ctx.fillRect(go.position.x, go.position.y, go.width, go.height);
        }
      }
    });
  }
}

class GameObject {
  position = { x: null, y: null };

  velocity = { x: 0, y: 1 };

  stationary = false;

  circular = false;

  width = 0;

  height = 0;

  rotation = 0;

  scaleX = 1;

  scaleY = 1;

  offsetX = 0;

  offsetY = 0;

  image = null;

  freeze = false;

  listeners = [];

  onRender(cb) {
    this.listeners.push(cb);
  }

  collider;

  constructor({
    position,
    width = 0,
    height = 0,
    scaleX = 1,
    scaleY = 1,
    image = null,
    onCollision,
    rotation,
    stationary = false,
    circular = false,
    offsetX = 0,
    offsetY = 0,
  }) {
    this.collider = new Collider(this, onCollision);
    if (position) this.position = position;

    this.width = width;
    this.height = height;

    this.scaleX = scaleX;
    this.scaleY = scaleY;

    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.image = image;

    this.circular = circular;

    if (rotation) {
      this.rotation = rotation;
    }

    if (stationary != null) {
      this.stationary = stationary;
    }
  }

  render(ctx, img) {
    if (!this.stationary && !this.freeze) {
      const gravity = 0.05;
      this.velocity.y += gravity;
      this.position.y += this.velocity.y;
      this.rotation += this.velocity.y / 10;

      if (this.rotation > 110) this.rotation = 110;
    }

    this.image = img;

    drawImage(
      ctx,
      this.image,
      this.position.x + this.offsetX,
      this.position.y + this.offsetY,
      this.rotation
    );

    this.listeners.forEach((cb) => cb(ctx, img));
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }
}

class Player extends GameObject {
  holdTime = 0;

  holdingSpace = false;

  constructor(args) {
    super({ ...args, circular: true });

    document.addEventListener("keydown", (e) => {
      if (e.key === " " && !this.freeze) {
        this.holdingSpace = true;

        if (this.holdTime < 8) this.holdTime += 1;
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === " " && this.holdingSpace && !this.freeze) {
        this.flap();
        this.holdingSpace = false;
        this.holdTime = 0;
      }
    });
  }

  flap() {
    this.velocity = { x: 0, y: -(1 + this.holdTime) };
  }
}

class Pipe extends GameObject {
  gap = 0;

  top = false;

  count = -1;

  movingUp = true;

  movingDown = false;

  constructor(args) {
    super(args);

    if (args.top) this.top = args.top;
  }

  setGap(amount) {
    const difficultyMultiplier = this.count / 50 + 1;
    const range = 300 / difficultyMultiplier;
    const minGap = 100;

    this.gap = amount ?? Math.floor(Math.random() * range);

    if (this.top) {
      if (this.gap >= 0) {
        this.gap = -this.gap;
      }

      if (this.gap < -minGap) this.gap = -minGap;
    } else {
      if (this.gap < minGap) this.gap = minGap;
    }
  }

  reset(count) {
    if (count !== this.count) {
      this.count = count;
      this.setGap();

      this.movingDown = false;
      this.movingUp = false;

      // if (this.count > 20) {
      const chance = 0.3; //0.05 + this.count / 50;
      if (Math.random() < chance) {
        this.movingDown = true;
      } else if (Math.random() < chance) {
        this.movingUp = true;
      }
      // }
    }
  }

  setPosition(x, y) {
    if (this.movingUp) {
      this.setGap(this.top ? this.gap + 0.5 : this.gap - 0.5);
    } else if (this.movingDown) {
      this.setGap(this.gap + 0.5);
    }
    this.position.x = x;
    this.position.y = y + this.gap;
  }
}

const maxSpeed = 4;

// The **MAIN** draw function. Hook in your own stuff here!
const mainDrawFunction = (app) => {
  const screenWidth = app.canvasRef.width;
  const screenHeight = app.canvasRef.height;

  // Draw the first 3 layers of the scenery at varying offsets
  let bgSpeedModifier = clamp(2 + (app.frameCounter / 10000 + 1), 0, maxSpeed);

  drawBackgroundAtOffset(
    app.ctx,
    app.image.layer0,
    app.frameCounter * 0.1 * bgSpeedModifier
  );
  drawBackgroundAtOffset(
    app.ctx,
    app.image.layer1,
    app.frameCounter * 0.4 * bgSpeedModifier
  );
  drawBackgroundAtOffset(
    app.ctx,
    app.image.layer2,
    app.frameCounter * 1.6 * bgSpeedModifier
  );

  // Draw the pipes ...
  const centerX = screenWidth * 0.5;
  const centerY = screenHeight * 0.5;
  const offsetX =
    (app.frameCounter * 3.2 * bgSpeedModifier) %
    (screenWidth + app.image.pipe.width);

  const wave = Math.floor(
    (app.frameCounter * 3.2 * bgSpeedModifier) /
      (screenWidth + app.image.pipe.width)
  );
  const score = Math.floor(
    (app.frameCounter * 3.2 * bgSpeedModifier + screenWidth / 2) /
      (screenWidth + app.image.pipe.width)
  );

  for (let i = 0; i < app.pipes.length; i += 2) {
    const x = screenWidth - offsetX + i;
    const pipeHeight = app.pipes[i + 1]?.image?.height ?? 0;

    const bottom = app.pipes[i];
    const top = app.pipes[i + 1];

    top.reset(wave);
    bottom.reset(wave);

    // lower pipe
    bottom.setPosition(x, centerY);

    // ... upper pipe (flipped)
    top.setPosition(x, centerY - pipeHeight);
  }

  // Draw the final foreground layer (the grass/ground)
  drawImage(app.ctx, app.image.layer3, 0, 0);

  app.pipes.forEach((pipe) => pipe.render(app.ctx, app.image.pipe));

  // app.player.position.x = centerX - 100;
  app.player.render(
    app.ctx,
    app.player.holdingSpace ? app.image.bird0 : app.image.bird1
  );

  // // Draw the score ...
  app.score = score;
  app.ctx.fillStyle = "white";
  app.ctx.strokeStyle = "black";
  app.ctx.font = "48px impact";
  app.ctx.lineWidth = 1.5;
  app.ctx.fillText(`Score: ${app.score}`, 20, 60);
  app.ctx.strokeText(`Score: ${app.score}`, 20, 60);
};

// The launch function, which kicks off the image loading and schedules the first frame
export const launch = (canvasRef) => {
  const app = {
    canvasRef: canvasRef,
    ctx: canvasRef.getContext("2d"),
    frameCounter: 0,
    image: {},
    loadStatus: "loading",
    score: 0,
    gameOver: false,
    setGameOver() {
      app.gameOver = true;
      app.gameObjects.forEach((go) => {
        go.freeze = true;
      });
    },
    restartGame() {
      app.gameOver = false;
      app.frameCounter = 0;
      app.score = 0;
      app.player.position.y = canvasRef.height / 2 - 100;
      app.player.rotation = 0;
      app.player.holdTime = 0;
      app.player.velocity.y = 0;
      app.gameObjects.forEach((go) => {
        go.freeze = false;
      });
    },
  };

  window.document.addEventListener("keypress", (e) => {
    if (e.key === " " && app.gameOver) {
      app.restartGame();
    }
  });

  const player = new Player({
    width: 50,
    height: 50,
    position: { y: canvasRef.height / 2 - 80, x: canvasRef.width / 2 - 80 },
    offsetX: -10,
    offsetY: -7,
    onCollision: () => {
      app.setGameOver();
    },
  });

  player.onRender(() => {
    if (player.position.y >= canvasRef.height - 50) {
      app.setGameOver();
    }
  });

  const pipes = [
    new Pipe({
      width: 116,
      height: 720,
      stationary: true,
    }),
    new Pipe({
      width: 116,
      height: 720,
      rotation: -180,
      stationary: true,
      top: true,
    }),
  ];

  app.player = player;
  app.pipes = pipes;
  app.gameObjects = [player, ...pipes];

  // Begin loading the images right away. Do not await the result.
  loadImages(
    {
      bird0: "bird0.png",
      bird1: "bird1.png",
      pipe: "pipe.png",
      layer0: "layer0.png",
      layer1: "layer1.png",
      layer2: "layer2.png",
      layer3: "layer3.png",
    },
    app
  );

  // Schedule the first animation frame.
  window.requestAnimationFrame(() => {
    drawFunctionSafetyWrapper(app);
  });
};
