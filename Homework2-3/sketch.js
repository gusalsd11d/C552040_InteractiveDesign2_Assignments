const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Events = Matter.Events;

let engine;
let mConstraint;

let bread;
let jam;
let crusts = [];
let jams = [];
let crustN;
let jamN;
let crustSec;

function setup() {
  let plate = createCanvas(windowWidth, windowHeight);
  plate.elt.style.touchAction = "none";
  rectMode(CENTER);
  engine = Engine.create();

  engine.gravity.y = 0;
  engine.gravity.x = 0;

  crustN = int(random(4, 10));
  jamN = int(random(4, 10));
  crustSec = int(random(8, 30));
  let margin = 20;
  Composite.add(engine.world, [
    Bodies.rectangle(width / 2, height - margin, width, margin, {
      isStatic: true,
    }),
    Bodies.rectangle(width / 2, margin, width, margin, { isStatic: true }),
    Bodies.rectangle(margin, height / 2, margin, height, { isStatic: true }),
    Bodies.rectangle(width - margin, height / 2, margin, height, {
      isStatic: true,
    }),
  ]);

  bread = Bodies.rectangle(width / 2, height / 2, 220, 220, {
    chamfer: {
      radius: [10, 10, 10, 10],
    },
    restitution: 0.2,
    frictionAir: 0.4,
    fill: "#ffd792",
    strokeFill: "#9e6f0a",
  });
  bread.w = 220;
  bread.h = 220;
  Composite.add(engine.world, [bread]);

  jam = Bodies.rectangle(width / 2 - 300, height / 2, 180, 180, {
    chamfer: {
      radius: [70, 30, 70, 30],
    },
    restitution: 0.1,
    frictionAir: 0.35,
    fill: "#a2156e",
    strokeFill: "#640742",
  });
  jam.w = 180;
  jam.h = 180;
  Composite.add(engine.world, [jam]);

  let plateMouse = Mouse.create(plate.elt);
  plateMouse.pixelRatio = pixelDensity();

  mConstraint = MouseConstraint.create(engine, {
    mouse: plateMouse,
    constraint: { stiffness: 0.2, render: { visible: false } },
  });
  Composite.add(engine.world, mConstraint);

  Events.on(engine, "collisionActive", function (event) {
    let pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
      let bodyA = pairs[i].bodyA;
      let bodyB = pairs[i].bodyB;
      if (bread && jam) {
        if (
          (bodyA === bread && bodyB === jam) ||
          (bodyA === jam && bodyB === bread)
        ) {
          if (frameCount % crustSec === 0) {
            Matter.Body.scale(bread, 0.8, 0.8);
            bread.w *= 0.8;
            bread.h *= 0.8;

            Matter.Body.scale(jam, 0.8, 0.8);

            for (let j = 0; j < crustN; j++) {
              let crustR = random(4, 25);
              let crust = Bodies.rectangle(
                bread.position.x,
                bread.position.y,
                crustR,
                crustR,
                {
                  restitution: 0.7,
                  frictionAir: 0.1,
                  fill: "#9e6f0a",
                },
              );
              Matter.Body.setVelocity(crust, {
                x: random(-10, 10),
                y: random(-10, 10),
              });

              Composite.add(engine.world, crust);
              crusts.push(crust);
            }

            for (let k = 0; k < jamN; k++) {
              let jamR = random(4, 10);
              let jamm = Bodies.circle(
                bread.position.x,
                bread.position.y,
                jamR,
                {
                  restitution: 1,
                  frictionAir: 0.15,
                  fill: "#a2156e",
                },
              );
              Matter.Body.setVelocity(jamm, {
                x: random(-10, 10),
                y: random(-10, 10),
              });

              Composite.add(engine.world, jamm);
              jams.push(jamm);
            }
          }

          if (bread.w < 30) {
            Composite.remove(engine.world, bread);
            Composite.remove(engine.world, jam);
            if (mConstraint.body === bread || mConstraint.body === jam) {
              mConstraint.body = null;
            }
            bread = null;
            jam = null;
          }
        }
      }
    }
  });
}

function draw() {
  Engine.update(engine);
  background("#83d8ff");
  for (let i = 0; i < 50; i++) {
    stroke("#3b80db");
    strokeWeight(6);
    line(-10, 20 + 40 * i, 10 + width, -640 + 40 * i);
  }

  fill("#ffffff");
  stroke("#d6d6d6");
  strokeWeight(4);
  circle(width / 2, height / 2, 300);

  noFill();
  stroke("#d6d6d6");
  strokeWeight(4);
  circle(width / 2, height / 2, 240);

  fill("#ffffff");
  stroke("#d6d6d6");
  strokeWeight(4);
  square(width / 2 - 300, height / 2, 230, 20);

  noFill();
  stroke("#d6d6d6");
  strokeWeight(4);
  square(width / 2 - 300, height / 2, 190, 20);

  if (jam) {
    push();
    beginShape();
    fill(jam.fill);
    stroke(jam.strokeFill);
    strokeWeight(6);
    for (let v of jam.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
  }

  if (bread) {
    push();
    beginShape();
    fill(bread.fill);
    stroke(bread.strokeFill);
    strokeWeight(6);
    for (let v of bread.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
  }

  for (let i = 0; i < crusts.length; i++) {
    let c = crusts[i];
    push();
    beginShape();
    fill(c.fill);
    noStroke();
    for (let v of c.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
  }

  for (let i = 0; i < jams.length; i++) {
    let j = jams[i];
    push();
    beginShape();
    fill(j.fill);
    noStroke();
    for (let v of j.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
  }
}
