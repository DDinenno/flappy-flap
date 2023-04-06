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
    img.addEventListener('load', () => {
      app.image[imageName] = img;
      completionLogic();
    });
    img.addEventListener('error', () => {
      console.log(`Error loading image: ${src}`);
      app.image._error = true;
      completionLogic();
    });
    img.src = images[imageName];
  }
}

// Wraps the "mainDrawFunction" in a try/catch and waits for all assets to load before allowing
// the mainDrawFunction to be called. Also wraps mainDrawFunction in a ctx.save() and .restore()
// to ensure consistency between frames.
const drawFunctionSafetyWrapper = (app) => {
  try {
    app.ctx.save(); // save the sate of the graphics context.

    if (app.loadStatus === "loading") {
      app.ctx.fillStyle = "white";
      app.ctx.fillRect(0,0, app.canvasRef.width,app.canvasRef.height);
      app.ctx.fillStyle = "black";
      app.ctx.font = "48px arial";
      app.ctx.fillText("Loading images ...", 20, 100);
    } else if (app.loadStatus === "failed") {
      app.ctx.fillStyle = "white";
      app.ctx.fillRect(0,0, app.canvasRef.width,app.canvasRef.height);
      app.ctx.fillStyle = "black";
      app.ctx.font = "48px arial";
      app.ctx.fillText("One or more images failed to load :-(", 20, 100);
    } else {
      mainDrawFunction(app);
      app.frameCounter++;
    }

    app.ctx.restore(); // restore the state of the graphics context. This way we know whatever we have done to its state, it is now undone.
  } catch (e) {
    console.log(`WARNING: your mainDrawFunction threw an uncaught exception:\n  ${e.message}`);
  }

  window.requestAnimationFrame(() => {
    drawFunctionSafetyWrapper(app);
  });
}

// draw a full-screen seamless tiling image at the specified offset
const drawBackgroundAtOffset = (ctx, img, offset) => {
  // asumes:
  // * img is the full size of the canvas, in pixels
  // * img seamlessly tiles on teh left and right
  const off = offset % img.width;
  if (off === 0) {
    drawImage(ctx, img, 0,0);
  } else {
    drawImage(ctx, img, -off, 0);
    drawImage(ctx, img, -off+img.width, 0);
    
  }
}

// draw an image at the specified position
const drawImage = (ctx, img, x,y) => {
  ctx.drawImage(img, x,y);
}

// draw an image at the specified position, with the specified scale applied to each axis
const drawImageScaled = (ctx, img, x,y, scaleX, scaleY) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(img, 0,0);
  ctx.restore();
}

// draw an image centered at the specified position, and rotated by the specified angle in degrees
const drawImageCentered = (ctx, img, x,y, angleDeg = 0) => {
  ctx.save();
  const halfWidth = Math.abs(img.width*0.5);
  const halfHeight = Math.abs(img.height*0.5);
  ctx.translate(x, y);
  ctx.rotate(((2.0 * Math.PI)/360.0) * angleDeg); // convert degrees to radians.
  ctx.translate(-halfWidth,-halfHeight);
  ctx.drawImage(img, 0,0);
  ctx.restore();
}

// The **MAIN** draw function. Hook in your own stuff here!
const mainDrawFunction = (app) => {

  const screenWidth = app.canvasRef.width;
  const screenHeight = app.canvasRef.height;
 
  // Draw the first 3 layers of the scenery at varying offsets
  const bgSpeedModifier = 0.5;
  drawBackgroundAtOffset(app.ctx, app.image.layer0, app.frameCounter*0.100*bgSpeedModifier);
  drawBackgroundAtOffset(app.ctx, app.image.layer1, app.frameCounter*0.400*bgSpeedModifier);
  drawBackgroundAtOffset(app.ctx, app.image.layer2, app.frameCounter*1.600*bgSpeedModifier);
  
  // Draw the pipes ...
  const centerX = screenWidth*0.5;
  const centerY = screenHeight*0.5;
  const offsetX = ((app.frameCounter*3.20*bgSpeedModifier) % (screenWidth+app.image.pipe.width));
  // ... lower pipe
  drawImage(app.ctx, app.image.pipe, screenWidth-offsetX,centerY);
  // ... upper pipe (flipped)
  drawImageScaled(app.ctx, app.image.pipe, screenWidth-offsetX,centerY-200, 1,-1);
  
  // Draw the final foreground layer (the grass/ground)
  drawImage(app.ctx,app.image.layer3, 0,0);

  // Draw the bird
  drawImageCentered(app.ctx, app.frameCounter % 30 < 15 ? app.image.bird0 : app.image.bird1, centerX-100,centerY-100, app.frameCounter % 359);

  // // Draw the score ...
  app.score = Math.floor(app.frameCounter / 160); // <-- just so the score changes as a demo.
  app.ctx.fillStyle = "white";
  app.ctx.strokeStyle = "black";
  app.ctx.font = "48px impact";
  app.ctx.lineWidth = 1.5;
  app.ctx.fillText(`Score: ${app.score}`, 20, 60);
  app.ctx.strokeText(`Score: ${app.score}`, 20, 60);
}

// The launch function, which kicks off the image loading and schedules the first frame
export const launch = (canvasRef) => {
  
  const images = [];
  const app = {
    canvasRef: canvasRef,
    ctx: canvasRef.getContext("2d"),
    frameCounter: 0,
    image: {},
    loadStatus: "loading",
    score: 0
  };

  // Begin loading the images right away. Do not await the result.
  loadImages(
    {
      bird0:  "bird0.png",
      bird1:  "bird1.png",
      pipe:   "pipe.png",
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
}
