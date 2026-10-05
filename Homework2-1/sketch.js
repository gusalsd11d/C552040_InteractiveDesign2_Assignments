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
let crusts = [];
let crustN;

function setup() {
  let plate = createCanvas(windowWidth, windowHeight);
  plate.elt.style.touchAction = "none";
  rectMode(CENTER);
  engine = Engine.create();

  engine.gravity.y = 0;
  engine.gravity.x = 0;

  crustN = int(random(15, 35));
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
  Composite.add(engine.world, [bread]);

  let plateMouse = Mouse.create(plate.elt);
  plateMouse.pixelRatio = pixelDensity();

  mConstraint = MouseConstraint.create(engine, {
    mouse: plateMouse,
    constraint: { stiffness: 0.2, render: { visible: false } },
  });
  Composite.add(engine.world, mConstraint);

  Events.on(mConstraint, "enddrag", function (event) {
    if (bread && event.body === bread) {
      let px = bread.position.x;
      let py = bread.position.y;

      Composite.remove(engine.world, bread);
      bread = null;

      for (let i = 0; i < crustN; i++) {
        let crustR = random(4, 25);
        let crust = Bodies.rectangle(px, py, crustR, crustR, {
          restitution: 0.7,
          frictionAir: 0.1,
          fill: "#9e6f0a",
        });

        Matter.Body.setVelocity(crust, {
          x: random(-10, 10),
          y: random(-10, 10),
        });

        Composite.add(engine.world, crust);
        crusts.push(crust);
      }
    }
  });
}

function draw() {
  Engine.update(engine);
  background("#ff9383");
  for (let i = 0; i < 50; i++) {
    stroke("#dc5b48");
    strokeWeight(6);
    line(20 + 40 * i, -10, 20 + 40 * i, 10 + height);
  }

  fill("#ffffff");
  stroke("#d6d6d6");
  strokeWeight(4);
  circle(width / 2, height / 2, 300);

  noFill();
  stroke("#d6d6d6");
  strokeWeight(4);
  circle(width / 2, height / 2, 240);

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
}
