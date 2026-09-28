const Engine = Matter.Engine;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Body = Matter.Body;

let engine;
let trouble, ground, a, b, c, d, e, f, g, h, l, j, k;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);

  engine = Engine.create();
  engine.gravity.y = 1;
  engine.gravity.x = 0;
  engine.gravity.scale = 0.001;

  let m = height / 20;
  let dw = width / 2;
  let kVertices = [
    { x: 0, y: height },
    { x: 300, y: height },
    { x: 0, y: height / 2 },
  ];

  ground = Bodies.rectangle(
    width / 2,
    (height * 77) / 80,
    width,
    (height * 3) / 40,
    {
      isStatic: true,
      fill: "#0e373b",
    },
  );

  let wall1 = Bodies.rectangle(width - m, height / 2, m, height * 10, {
    isStatic: true,
  });
  let wall2 = Bodies.rectangle(-m, height / 2, m, height * 10, {
    isStatic: true,
  });

  Composite.add(engine.world, [
    Bodies.rectangle(width / 2, height - m, width, m, {
      isStatic: true,
    }),
    Bodies.rectangle(width - m, height / 2, m, height * 10, {
      isStatic: true,
    }),
    Bodies.rectangle(-m, height / 2, m, height * 10, {
      isStatic: true,
    }),
  ]);

  a = Bodies.polygon(dw - 60, 20, 3, 90, {
    restitution: 0,
    frictionAir: 0.05,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  b = Bodies.polygon(dw + 500, 0, 4, 40, {
    restitution: 0.6,
    frictionAir: 0.01,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  c = Bodies.polygon(dw + 330, 20, 4, 90, {
    restitution: 0,
    frictionAir: 0.2,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  d = Bodies.polygon(dw + 15, -270, 3, 160, {
    restitution: 0,
    frictionAir: 0.1,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  e = Bodies.polygon(dw + 300, 200, 4, 150, {
    restitution: 1,
    frictionAir: 0.05,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  f = Bodies.polygon(dw + 500, 10, 3, 40, {
    restitution: 0.7,
    frictionAir: 0,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  g = Bodies.polygon(dw + 100, 90, 3, 90, {
    restitution: 0,
    frictionAir: 0.1,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  h = Bodies.polygon(dw + 360, -150, 4, 40, {
    restitution: 0.3,
    frictionAir: 0.05,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  l = Bodies.polygon(dw + 500, 40, 3, 60, {
    restitution: 0.4,
    frictionAir: 0.1,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  j = Bodies.polygon(dw + 550, 60, 3, 30, {
    restitution: 0.7,
    frictionAir: 0.4,
    fill: "#0f4a50",
    strokeFill: "#f69b33",
  });
  trouble = Bodies.circle(310, -18000, 220, {
    restitution: 4,
    frictionAir: 0.01,
    fill: "#ff0000",
  });
  k = Bodies.fromVertices(100, height - 100, [kVertices], {
    restitution: 0,
    frictionAir: 0.4,
    fill: "#0e373b",
    isStatic: true,
  });

  Composite.add(engine.world, [trouble, a, b, c, d, e, f, g, h, l, j, k]);
  Body.setAngularVelocity(trouble, -0.4);
  Body.setAngularVelocity(a, 0.1);
  Body.setAngularVelocity(b, -0.3);
  Body.setAngularVelocity(c, -0.4);
  Body.setAngularVelocity(d, 0.2);
  Body.setAngularVelocity(e, 0.9);
  Body.setAngularVelocity(f, -0.2);
  Body.setAngularVelocity(g, 0.5);
  Body.setAngularVelocity(h, -1);
  Body.setAngularVelocity(l, -0.8);
  Body.setAngularVelocity(j, 1);
  Body.setAngularVelocity(k, 0);
}

function draw() {
  Engine.update(engine);
  background("#f69b33");

  beginShape();
  fill(ground.fill);
  noStroke();
  for (let i = 0; i < ground.vertices.length; i++) {
    let x = ground.vertices[i].x;
    let y = ground.vertices[i].y;
    vertex(x, y);
  }
  endShape();

  beginShape();
  fill(a.fill);
  stroke(a.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < a.vertices.length; i++) {
    let x = a.vertices[i].x;
    let y = a.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(b.fill);
  stroke(b.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < b.vertices.length; i++) {
    let x = b.vertices[i].x;
    let y = b.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(c.fill);
  stroke(c.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < c.vertices.length; i++) {
    let x = c.vertices[i].x;
    let y = c.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(d.fill);
  stroke(d.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < d.vertices.length; i++) {
    let x = d.vertices[i].x;
    let y = d.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(e.fill);
  stroke(e.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < e.vertices.length; i++) {
    let x = e.vertices[i].x;
    let y = e.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(f.fill);
  stroke(f.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < f.vertices.length; i++) {
    let x = f.vertices[i].x;
    let y = f.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(g.fill);
  stroke(g.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < g.vertices.length; i++) {
    let x = g.vertices[i].x;
    let y = g.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(h.fill);
  stroke(h.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < h.vertices.length; i++) {
    let x = h.vertices[i].x;
    let y = h.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(l.fill);
  stroke(l.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < l.vertices.length; i++) {
    let x = l.vertices[i].x;
    let y = l.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(j.fill);
  stroke(j.strokeFill);
  strokeWeight(0.5);
  for (let i = 0; i < j.vertices.length; i++) {
    let x = j.vertices[i].x;
    let y = j.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);

  beginShape();
  fill(trouble.fill);
  for (let v of trouble.vertices) {
    vertex(v.x, v.y);
  }
  endShape(CLOSE);

  beginShape();
  fill(k.fill);
  noStroke();
  for (let i = 0; i < k.vertices.length; i++) {
    let x = k.vertices[i].x;
    let y = k.vertices[i].y;
    vertex(x, y);
  }
  endShape(CLOSE);
}
