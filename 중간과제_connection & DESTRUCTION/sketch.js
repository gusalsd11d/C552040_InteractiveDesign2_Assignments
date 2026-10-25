const Engine = Matter.Engine;
const Body = Matter.Body;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;
const Events = Matter.Events;
const Constraint = Matter.Constraint;
const Runner = Matter.Runner;

const CAT_DEFAULT = 0x0001;
const CAT_MEMO = 0x0002;
const CAT_PIECE = 0x0004;

let engine;
let world;
let mConstraint;
let memos = [];
let pieces = [];
let lines = [];

let memowrite;
let memoModalTitle;
let memoTitleInput;
let inputBox;
let submitBox;
let cancelBtn;
let memoDate;
let memoTime;
let memoColorPicker;
let colorHistoryPicker;

let colorHistory = ["#f4e79f"];

let isLining = false;
let memoLining = null;
let searchedLineName = null;
let pendingConnection = null;
let grabbedLine = null;

let isDraggingNewMemo = false;
let pendingMemoX = null;
let pendingMemoY = null;
let lastClickTime = 0;
let lastClickedMemoId = null;
let editingMemo = null;

let deleteModal;
let targetMemoForDelete = null;
let mergeModal;

let searchInput;
let searchBtn;
let listBtn;
let searchResultDiv;
let lineSelectModal;
let orderSelectModal;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style("touch-action", "none");

  textSize(14);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  engine = Engine.create();
  world = engine.world;

  let m = 60;
  let wallOptions = {
    isStatic: true,
    collisionFilter: {
      category: CAT_DEFAULT,
      mask: CAT_DEFAULT | CAT_MEMO | CAT_PIECE,
      group: 0,
    },
  };

  Composite.add(engine.world, [
    Bodies.rectangle(
      windowWidth / 2,
      windowHeight + m / 2,
      windowWidth,
      m,
      wallOptions,
    ),
    Bodies.rectangle(windowWidth / 2, -m / 2, windowWidth, m, wallOptions),
    Bodies.rectangle(-m / 2, windowHeight / 2, m, windowHeight, wallOptions),
    Bodies.rectangle(
      windowWidth + m / 2,
      windowHeight / 2,
      m,
      windowHeight,
      wallOptions,
    ),
  ]);

  let canvasMouse = Mouse.create(cnv.elt);
  canvasMouse.pixelRatio = pixelDensity();
  mConstraint = MouseConstraint.create(engine, {
    mouse: canvasMouse,
    collisionFilter: {
      category: CAT_DEFAULT,
      mask: CAT_DEFAULT | CAT_MEMO | CAT_PIECE,
      group: 0,
    },
  });
  Composite.add(world, mConstraint);

  memowrite = createDiv();
  memowrite.style("position", "absolute");
  memowrite.style("top", "50%");
  memowrite.style("left", "50%");
  memowrite.style("transform", "translate(-50%, -50%)");
  memowrite.style("background", "white");
  memowrite.style("padding", "20px");
  memowrite.style("border-radius", "8px");
  memowrite.style("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.2)");
  memowrite.style("display", "none");
  memowrite.style("z-index", "1000");

  memoModalTitle = createElement("h3", "새 메모");
  memoModalTitle.parent(memowrite).style("margin-top", "0");

  memoTitleInput = createInput("");
  memoTitleInput.parent(memowrite);
  memoTitleInput.style("width", "300px");
  memoTitleInput.style("padding", "10px");
  memoTitleInput.style("font-size", "14px");
  memoTitleInput.style("font-weight", "bold");
  memoTitleInput.style("display", "block");
  memoTitleInput.style("margin-bottom", "10px");
  memoTitleInput.style("box-sizing", "border-box");
  memoTitleInput.attribute("placeholder", "메모 제목");

  inputBox = createElement("textarea");
  inputBox.parent(memowrite);
  inputBox.style("width", "300px");
  inputBox.style("height", "130px");
  inputBox.style("resize", "none");
  inputBox.style("padding", "10px");
  inputBox.style("font-size", "14px");
  inputBox.style("display", "block");
  inputBox.style("margin-bottom", "15px");
  inputBox.style("box-sizing", "border-box");
  inputBox.attribute("placeholder", "여기에 상세 내용을 입력하세요.");

  memoDate = createInput("", "date");
  memoDate.parent(memowrite);
  memoDate.style("display", "inline-block");
  memoDate.style("margin-bottom", "10px");
  memoDate.style("margin-right", "10px");
  memoDate.style("padding", "5px");
  memoDate.style("font-size", "14px");

  memoTime = createInput("", "time");
  memoTime.parent(memowrite);
  memoTime.style("display", "inline-block");
  memoTime.style("margin-bottom", "10px");
  memoTime.style("padding", "5px");
  memoTime.style("font-size", "14px");

  memoColorPicker = createColorPicker("#f4e79f");
  memoColorPicker.parent(memowrite);
  memoColorPicker.style("display", "block");
  memoColorPicker.style("margin-bottom", "15px");
  memoColorPicker.style("cursor", "pointer");

  colorHistoryPicker = createDiv("최근 사용 색상: ");
  colorHistoryPicker.parent(memowrite);
  colorHistoryPicker.style("margin-bottom", "15px");
  colorHistoryPicker.style("font-size", "12px");
  colorHistoryPicker.style("display", "flex");
  colorHistoryPicker.style("gap", "5px");

  submitBox = createButton("작성 완료");
  submitBox.parent(memowrite);
  submitBox.style("padding", "8px 16px");
  submitBox.style("margin-right", "10px");
  submitBox.style("cursor", "pointer");
  submitBox.mousePressed(submitMemo);

  cancelBtn = createButton("취소");
  cancelBtn.parent(memowrite);
  cancelBtn.style("padding", "8px 16px");
  cancelBtn.style("cursor", "pointer");
  cancelBtn.mousePressed(closeMemo);

  searchInput = createInput("");
  searchInput.position(20, 20);
  searchInput.attribute("placeholder", "연결선 이름 검색...");
  searchInput.style("padding", "6px");
  searchInput.elt.addEventListener("keydown", function (e) {
    if (e.key === "Enter") searchLines();
  });

  searchBtn = createButton("검색");
  searchBtn.position(190, 20);
  searchBtn.style("padding", "6px 10px");
  searchBtn.style("cursor", "pointer");
  searchBtn.mousePressed(searchLines);

  listBtn = createButton("전체 목록");
  listBtn.position(245, 20);
  listBtn.style("padding", "6px 10px");
  listBtn.style("cursor", "pointer");
  listBtn.mousePressed(showAllLinesList);

  searchResultDiv = createDiv("");
  searchResultDiv.position(20, 60);
  searchResultDiv.style("background", "rgba(255, 255, 255, 0.95)");
  searchResultDiv.style("padding", "15px");
  searchResultDiv.style("border", "1px solid #ccc");
  searchResultDiv.style("border-radius", "8px");
  searchResultDiv.style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)");
  searchResultDiv.style("display", "none");
  searchResultDiv.style("max-width", "320px");
  searchResultDiv.style("max-height", "400px");
  searchResultDiv.style("overflow-y", "auto");
  searchResultDiv.style("z-index", "90");

  lineSelectModal = createDiv("");
  lineSelectModal.style("position", "absolute");
  lineSelectModal.style("top", "50%");
  lineSelectModal.style("left", "50%");
  lineSelectModal.style("transform", "translate(-50%, -50%)");
  lineSelectModal.style("background", "white");
  lineSelectModal.style("padding", "20px");
  lineSelectModal.style("border-radius", "8px");
  lineSelectModal.style("box-shadow", "0 4px 20px rgba(0,0,0,0.25)");
  lineSelectModal.style("display", "none");
  lineSelectModal.style("z-index", "1000");
  lineSelectModal.style("min-width", "280px");

  deleteModal = createDiv("");
  deleteModal.style("position", "absolute");
  deleteModal.style("top", "50%");
  deleteModal.style("left", "50%");
  deleteModal.style("transform", "translate(-50%, -50%)");
  deleteModal.style("background", "white");
  deleteModal.style("padding", "20px");
  deleteModal.style("border-radius", "8px");
  deleteModal.style("box-shadow", "0 4px 20px rgba(0,0,0,0.25)");
  deleteModal.style("display", "none");
  deleteModal.style("z-index", "1000");
  deleteModal.style("min-width", "250px");
  deleteModal.style("text-align", "center");

  mergeModal = createDiv("");
  mergeModal.style("position", "absolute");
  mergeModal.style("top", "50%");
  mergeModal.style("left", "50%");
  mergeModal.style("transform", "translate(-50%, -50%)");
  mergeModal.style("background", "white");
  mergeModal.style("padding", "20px");
  mergeModal.style("border-radius", "8px");
  mergeModal.style("box-shadow", "0 4px 20px rgba(0,0,0,0.25)");
  mergeModal.style("display", "none");
  mergeModal.style("z-index", "1000");
  mergeModal.style("min-width", "280px");

  let savedColors = getItem("ColorHistory");
  if (savedColors) colorHistory = savedColors;

  let savedMemos = getItem("Memomemo");
  if (savedMemos !== null) {
    for (let s of savedMemos) {
      let mColor = s.memoColor ? s.memoColor : "#f4e79f";
      let title = s.title ? s.title : "제목 없음";
      let rTxt = s.rawTxt !== undefined ? s.rawTxt : s.txt.replace(/\n/g, "");
      addMemo(
        title,
        rTxt,
        s.dateStr,
        mColor,
        s.isPinned,
        s.x,
        s.y,
        s.id,
        s.deadlineTime,
        true,
        s.orderNum,
        rTxt,
        s.rawDate || "",
        s.rawTime || "",
      );
    }
  }

  let savedLines = getItem("MemoLines");
  if (savedLines !== null) {
    for (let ll of savedLines) {
      let memoA = memos.find((m) => m.body.id === ll.bodyA_id);
      let memoB = memos.find((m) => m.body.id === ll.bodyB_id);

      if (memoA && memoB) {
        let newConstraint = Constraint.create({
          bodyA: memoA.body,
          bodyB: memoB.body,
          length: 220,
          stiffness: 0.5,
          render: { visible: false },
        });
        Composite.add(world, newConstraint);
        lines.push({ constraint: newConstraint, name: ll.name });
      }
    }
  }

  Events.on(engine, "collisionStart", function (event) {
    event.pairs.forEach((pair) => {
      let m1 = memos.find((m) => m.body.id === pair.bodyA.id);
      let m2 = memos.find((m) => m.body.id === pair.bodyB.id);

      if (
        m1 &&
        m2 &&
        isMemoConnected(m1.body.id) &&
        isMemoConnected(m2.body.id)
      ) {
        return;
      }

      shatter(pair.bodyA);
      shatter(pair.bodyB);
    });
  });

  Events.on(engine, "beforeUpdate", function () {
    if (
      isLining ||
      pendingConnection !== null ||
      grabbedLine !== null ||
      isDraggingNewMemo
    ) {
      mConstraint.body = null;
    }

    if (searchedLineName !== null && mConstraint.body) {
      let matchedLines = lines.filter((l) => l.name === searchedLineName);
      let allowed = false;
      for (let l of matchedLines) {
        if (
          l.constraint.bodyA.id === mConstraint.body.id ||
          l.constraint.bodyB.id === mConstraint.body.id
        ) {
          allowed = true;
          break;
        }
      }
      if (!allowed) mConstraint.body = null;
    }

    if (grabbedLine !== null) {
      let mA = memos.find((m) => m.body.id === grabbedLine.constraint.bodyA.id);
      let mB = memos.find((m) => m.body.id === grabbedLine.constraint.bodyB.id);
      if (mA && mB) {
        let forceStrength = 0.0015;
        let forceA = {
          x: (mouseX - mA.body.position.x) * forceStrength,
          y: (mouseY - mA.body.position.y) * forceStrength,
        };
        let forceB = {
          x: (mouseX - mB.body.position.x) * forceStrength,
          y: (mouseY - mB.body.position.y) * forceStrength,
        };

        Body.applyForce(mA.body, mA.body.position, forceA);
        Body.applyForce(mB.body, mB.body.position, forceB);
      }
    }

    for (let m of memos) {
      if (m.isPinned) {
        let gravity = engine.world.gravity;
        Body.applyForce(m.body, m.body.position, {
          x: 0,
          y: -gravity.y * gravity.scale * m.body.mass,
        });
      }
    }
  });

  Runner.run(Runner.create(), engine);
}

function draw() {
  background(240);

  push();
  fill(255);
  stroke(180);
  strokeWeight(2);
  rectMode(CENTER);
  rect(15, height / 2, 50, 100, 0, 5, 5, 0);

  noStroke();
  fill(150);
  textSize(24);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text("+", 15, height / 2);
  pop();

  for (let i = lines.length - 1; i >= 0; i--) {
    let l = lines[i];
    if (
      !memos.find((m) => m.body.id === l.constraint.bodyA.id) ||
      !memos.find((m) => m.body.id === l.constraint.bodyB.id)
    ) {
      Composite.remove(world, l.constraint);
      lines.splice(i, 1);
      saveLines();
      continue;
    }

    let posA = l.constraint.bodyA.position;
    let posB = l.constraint.bodyB.position;

    stroke(100);
    strokeWeight(3);

    if (grabbedLine === l) {
      line(posA.x, posA.y, mouseX, mouseY);
      line(mouseX, mouseY, posB.x, posB.y);

      noStroke();
      fill(255, 255, 255, 200);
      rectMode(CENTER);
      rect(mouseX, mouseY - 20, textWidth(l.name) + 10, 20, 5);
      fill(0);
      textSize(14);
      text(l.name, mouseX, mouseY - 20);
    } else {
      line(posA.x, posA.y, posB.x, posB.y);
      let centerX = (posA.x + posB.x) / 2;
      let centerY = (posA.y + posB.y) / 2;

      noStroke();
      fill(255, 255, 255, 200);
      rectMode(CENTER);
      rect(centerX, centerY, textWidth(l.name) + 10, 20, 5);

      fill(0);
      textSize(14);
      text(l.name, centerX, centerY);
    }
  }

  if (isLining && memoLining) {
    stroke(150, 150, 255);
    strokeWeight(2);
    drawingContext.setLineDash([5, 5]);
    let startX = memoLining.body.position.x - memoLining.currentW / 2 + 15;
    let startY = memoLining.body.position.y - memoLining.currentH / 2 + 15;
    line(startX, startY, mouseX, mouseY);
    drawingContext.setLineDash([]);
  }

  for (let i = pieces.length - 1; i >= 0; i--) {
    let p = pieces[i];
    push();
    translate(p.position.x, p.position.y);
    rotate(p.angle);
    noStroke();
    p.life -= 3;
    fill(145, 144, 142, max(0, p.life));
    rect(0, 0, p.pw, p.pw);
    pop();
    if (p.life <= 0 || p.position.y > height + 100) {
      Composite.remove(world, p);
      pieces.splice(i, 1);
    }
  }

  for (let m of memos) {
    drawSingleMemo(m);
  }

  if (searchedLineName !== null) {
    noStroke();
    fill(0, 0, 0, 180);
    rectMode(CORNER);
    rect(0, 0, width, height);

    let matchedLines = lines.filter((l) => l.name === searchedLineName);
    let targetMemoIds = new Set();

    for (let l of matchedLines) {
      let memoA = memos.find((m) => m.body.id === l.constraint.bodyA.id);
      let memoB = memos.find((m) => m.body.id === l.constraint.bodyB.id);

      if (memoA && memoB) {
        targetMemoIds.add(memoA.body.id);
        targetMemoIds.add(memoB.body.id);
        let posA = memoA.body.position;
        let posB = memoB.body.position;

        stroke(255, 255, 100);
        strokeWeight(4);
        line(posA.x, posA.y, posB.x, posB.y);

        let centerX = (posA.x + posB.x) / 2;
        let centerY = (posA.y + posB.y) / 2;
        noStroke();
        fill(255);
        rectMode(CENTER);
        rect(centerX, centerY, textWidth(l.name) + 20, 26, 5);
        fill(0);
        textSize(16);
        text(l.name, centerX, centerY);
      }
    }

    for (let mId of targetMemoIds) {
      let targetM = memos.find((m) => m.body.id === mId);
      if (targetM) drawSingleMemo(targetM);
    }
  }

  if (isDraggingNewMemo) {
    push();
    fill(255, 255, 255, 200);
    stroke(180);
    strokeWeight(1.5);
    rectMode(CENTER);
    rect(mouseX, mouseY, 160, 120, 5);
    pop();
  }
}

function isMemoConnected(memoId) {
  for (let l of lines) {
    if (l.constraint.bodyA.id === memoId || l.constraint.bodyB.id === memoId) {
      return true;
    }
  }
  return false;
}

function getConnectedNetwork(startId) {
  let visited = new Set();
  let queue = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    let curr = queue.shift();
    for (let l of lines) {
      let idA = l.constraint.bodyA.id;
      let idB = l.constraint.bodyB.id;
      if (idA === curr && !visited.has(idB)) {
        visited.add(idB);
        queue.push(idB);
      } else if (idB === curr && !visited.has(idA)) {
        visited.add(idA);
        queue.push(idA);
      }
    }
  }

  let result = [];
  visited.forEach((id) => {
    let found = memos.find((m) => m.body.id === id);
    if (found) result.push(found);
  });
  return result;
}

function rearrangeNetwork(startMemo) {
  let network = getConnectedNetwork(startMemo.body.id);
  if (network.length <= 1) return;

  let networkIds = new Set(network.map((m) => m.body.id));
  let lineName = "연결선";
  for (let l of lines) {
    if (networkIds.has(l.constraint.bodyA.id)) {
      lineName = l.name;
      break;
    }
  }

  let anchorMemo = network.reduce((prev, curr) =>
    prev.body.position.x < curr.body.position.x ? prev : curr,
  );
  let startX = anchorMemo.body.position.x;
  let startY = anchorMemo.body.position.y;

  for (let i = lines.length - 1; i >= 0; i--) {
    let idA = lines[i].constraint.bodyA.id;
    if (networkIds.has(idA)) {
      Composite.remove(world, lines[i].constraint);
      lines.splice(i, 1);
    }
  }

  let ordered = network
    .filter((m) => m.orderNum && m.orderNum > 0)
    .sort((a, b) => a.orderNum - b.orderNum);
  let unordered = network.filter((m) => !m.orderNum || m.orderNum <= 0);
  let totalCount = network.length;

  for (let i = 0; i < ordered.length; i++) {
    ordered[i].orderNum = i + 1;
  }

  let usedNumbers = new Set(ordered.map((m) => m.orderNum));

  for (let m of unordered) {
    for (let i = 1; i <= totalCount; i++) {
      if (!usedNumbers.has(i)) {
        m.orderNum = i;
        usedNumbers.add(i);
        ordered.push(m);
        break;
      }
    }
  }

  ordered.sort((a, b) => a.orderNum - b.orderNum);
  let combined = ordered;

  let gapX = 220;

  for (let i = 0; i < combined.length - 1; i++) {
    let m1 = combined[i];
    let m2 = combined[i + 1];
    let newConstraint = Constraint.create({
      bodyA: m1.body,
      bodyB: m2.body,
      length: gapX,
      stiffness: 0.5,
      render: { visible: false },
    });
    Composite.add(world, newConstraint);
    lines.push({ constraint: newConstraint, name: lineName });
  }
  saveLines();

  for (let i = 0; i < combined.length; i++) {
    let m = combined[i];
    Body.setPosition(m.body, { x: startX + i * gapX, y: startY });

    Body.setVelocity(m.body, { x: 0, y: 0 });
    Body.setAngularVelocity(m.body, 0);
    Body.setAngle(m.body, 0);
    m.body.force = { x: 0, y: 0 };
    m.body.torque = 0;
  }
}

function drawSingleMemo(m) {
  push();
  translate(m.body.position.x, m.body.position.y);

  let isExpired = m.deadlineTime && Date.now() >= m.deadlineTime;
  let bgColor = !m.isPinned ? color("#91908e") : color(m.memoColor);

  if (isExpired) bgColor = lerpColor(bgColor, color(240), 0.75);

  let r = red(bgColor);
  let g = green(bgColor);
  let b = blue(bgColor);
  let yiq = (r * 299 + g * 587 + b * 114) / 1000;
  let isDark = yiq < 128;

  let mainTextColor = isDark ? 255 : 0;
  let subTextColor = isDark ? 200 : 80;
  let expiredTextColor = isDark ? 180 : 120;

  fill(bgColor);
  noStroke();
  rectMode(CENTER);
  rect(0, 0, m.currentW, m.currentH, 5);

  let hw = m.currentW / 2;
  let hh = m.currentH / 2;

  if (m.isPinned) {
    if (isExpired) fill(180, 200, 255);
    else fill(100, 150, 255);
    circle(-hw + 13, -hh + 13, 12);
    fill(255);
    circle(-hw + 13, -hh + 13, 5);

    if (isExpired) fill(255, 180, 180);
    else fill(255, 100, 100);
    circle(hw - 13, -hh + 13, 14);
    fill(255);
    textSize(9);
    textAlign(CENTER, CENTER);
    text("X", hw - 13, -hh + 13);

    if (isMemoConnected(m.body.id)) {
      let net = getConnectedNetwork(m.body.id);
      let isOrdered = net.some((netM) => netM.orderNum > 0);
      let maxOrder = net.length;

      let cx = hw - 22;
      let cy = hh - 14;

      if (!isOrdered) {
        let btnW = 28;
        let btnH = 18;
        if (isExpired) fill(255, 200, 150);
        else fill(251, 175, 35);
        rectMode(CENTER);
        rect(cx, cy, btnW, btnH, 8);
        fill(255);
        textSize(11);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text("123", cx, cy);
      } else {
        let hasLeft = m.orderNum > 1;
        let hasRight = m.orderNum < maxOrder;

        let leftBtnX = hasRight ? cx - 12 : cx;
        let rightBtnX = hasLeft ? cx + 12 : cx;

        if (hasLeft) {
          if (isExpired) fill(255, 200, 150);
          else fill(251, 175, 35);
          rectMode(CENTER);
          rect(leftBtnX, cy, 18, 18, 5);
          fill(255);
          textSize(12);
          textAlign(CENTER, CENTER);
          textStyle(BOLD);
          text("<", leftBtnX, cy - 1);
        }
        if (hasRight) {
          if (isExpired) fill(255, 200, 150);
          else fill(251, 175, 35);
          rectMode(CENTER);
          rect(rightBtnX, cy, 18, 18, 5);
          fill(255);
          textSize(12);
          textAlign(CENTER, CENTER);
          textStyle(BOLD);
          text(">", rightBtnX, cy - 1);
        }
      }
    }

    if (isExpired)
      fill(isDark ? color(255, 255, 255, 100) : color(0, 0, 0, 50));
    else fill(isDark ? color(255, 255, 255, 180) : color(0, 0, 0, 130));
    textSize(18);
    textAlign(CENTER, BOTTOM);
    textStyle(BOLD);
    text("...", 0, hh - 4);

    if (m.orderNum && m.orderNum > 0) {
      if (isExpired) fill(expiredTextColor);
      else fill(mainTextColor);
      textSize(13);
      textStyle(BOLD);
      textAlign(LEFT, BOTTOM);
      text(m.orderNum + ".", -hw + 10, hh - 6);
    }
  }

  if (m.isCompact) {
    if (isExpired) fill(expiredTextColor);
    else fill(mainTextColor);
    textSize(14);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    let shortTitle =
      m.title.length > 8 ? m.title.substring(0, 8) + ".." : m.title;
    text(shortTitle, 0, -3);
    textStyle(NORMAL);
  } else {
    if (isExpired) fill(expiredTextColor);
    else fill(mainTextColor);
    textSize(14);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(m.title, 0, -hh + 15);
    textStyle(NORMAL);

    if (isExpired) fill(150);
    else fill(subTextColor);
    textSize(10);
    textAlign(CENTER, TOP);
    if (m.dateStr) text(m.dateStr, 0, -hh + 28);

    if (isExpired) fill(expiredTextColor);
    else fill(mainTextColor);
    textSize(13);
    textAlign(CENTER, TOP);
    text(m.txt, 0, -hh + 48);
  }
  pop();
}

function openMemo() {
  editingMemo = null;
  memoModalTitle.html("새 메모");
  memowrite.style("display", "block");
  updateColorHistory();
}

function openEditMemo(m) {
  editingMemo = m;
  memoModalTitle.html("메모 수정");
  memoTitleInput.value(m.title === "제목 없음" ? "" : m.title);
  inputBox.value(m.rawTxt || "");
  memoDate.value(m.rawDate || "");
  memoTime.value(m.rawTime || "");
  memoColorPicker.value(m.memoColor || "#f4e79f");

  memowrite.style("display", "block");
  updateColorHistory();
}

function closeMemo() {
  memowrite.style("display", "none");
  inputBox.value("");
  memoTitleInput.value("");
  memoDate.value("");
  memoTime.value("");
  pendingMemoX = null;
  pendingMemoY = null;
  editingMemo = null;
}

function updateColorHistory() {
  colorHistoryPicker.html("최근 사용 색상: ");
  for (let col of colorHistory) {
    let btn = createButton("");
    btn.parent(colorHistoryPicker);
    btn.style("width", "20px");
    btn.style("height", "20px");
    btn.style("background-color", col);
    btn.style("border", "1px solid #ccc");
    btn.style("cursor", "pointer");
    btn.mousePressed(() => {
      memoColorPicker.value(col);
    });
  }
}

function submitMemo() {
  let title = memoTitleInput.value().trim();
  if (title === "") title = "제목 없음";

  let txt = inputBox.value();
  if (txt.trim() === "") {
    alert("내용을 입력해주세요.");
    return;
  }

  let dateVal = memoDate.value();
  let timeVal = memoTime.value();
  let dateStr = "";
  let deadlineTime = null;

  if (dateVal !== "" || timeVal !== "") {
    let datePart = dateVal !== "" ? dateVal : "미지정";
    let timePart = timeVal !== "" ? timeVal : "미지정";
    dateStr = `기한: ${datePart} | ${timePart}`;
    if (dateVal !== "" && timeVal !== "") {
      let d = new Date(`${dateVal}T${timeVal}`);
      deadlineTime = d.getTime();
    }
  }

  let memoColor = memoColorPicker.value();
  if (!colorHistory.includes(memoColor)) {
    colorHistory.unshift(memoColor);
    if (colorHistory.length > 5) colorHistory.pop();
    storeItem("ColorHistory", colorHistory);
  }

  if (editingMemo) {
    editingMemo.title = title;
    editingMemo.rawTxt = txt;
    editingMemo.txt = getWrappedText(txt, 140);
    editingMemo.rawDate = dateVal;
    editingMemo.rawTime = timeVal;
    editingMemo.dateStr = dateStr;
    editingMemo.deadlineTime = deadlineTime;
    editingMemo.memoColor = memoColor;

    let wrappedArray = editingMemo.txt.split("\n");
    let actualMaxWidth = 70;
    push();
    textSize(13);
    for (let line of wrappedArray) {
      let lw = textWidth(line);
      if (lw > actualMaxWidth) actualMaxWidth = lw;
    }
    pop();

    editingMemo.w = max(actualMaxWidth + 30, 160);
    editingMemo.h = max(wrappedArray.length * 18 + 75, 120);

    let targetW = editingMemo.isCompact ? 160 : editingMemo.w;
    let targetH = editingMemo.isCompact ? 50 : editingMemo.h;

    let scaleX = targetW / editingMemo.currentW;
    let scaleY = targetH / editingMemo.currentH;
    Body.scale(editingMemo.body, scaleX, scaleY);

    editingMemo.currentW = targetW;
    editingMemo.currentH = targetH;
    editingMemo = null;
  } else {
    let startX = pendingMemoX !== null ? pendingMemoX : width / 2;
    let startY = pendingMemoY !== null ? pendingMemoY : height / 2;
    addMemo(
      title,
      txt,
      dateStr,
      memoColor,
      true,
      startX,
      startY,
      null,
      deadlineTime,
      true,
      null,
      txt,
      dateVal,
      timeVal,
    );
  }

  closeMemo();
  saveMemos();
}

function getWrappedText(txt, maxWidth) {
  let rawLines = txt.split("\n");
  let wrappedLines = [];
  for (let rawLine of rawLines) {
    if (rawLine === "") {
      wrappedLines.push("");
      continue;
    }
    let currentLine = "";
    for (let i = 0; i < rawLine.length; i++) {
      let char = rawLine[i];
      let testLine = currentLine + char;
      push();
      textSize(13);
      let measure = textWidth(testLine);
      pop();
      if (measure > maxWidth && currentLine.length > 0) {
        wrappedLines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) wrappedLines.push(currentLine);
  }
  return wrappedLines.join("\n");
}

function addMemo(
  title,
  txt,
  dateStr,
  memoColor,
  isPinned,
  startX,
  startY,
  idStr,
  deadlineTime,
  isCompact = true,
  orderNum = null,
  rawTxt = null,
  rawDate = "",
  rawTime = "",
) {
  let MAX_TEXT_WIDTH = 140;
  let wrappedStr = getWrappedText(txt, MAX_TEXT_WIDTH);
  let wrappedArray = wrappedStr.split("\n");

  let actualMaxWidth = 70;
  push();
  textSize(13);
  for (let line of wrappedArray) {
    let lw = textWidth(line);
    if (lw > actualMaxWidth) actualMaxWidth = lw;
  }
  pop();

  let w = max(actualMaxWidth + 30, 160);
  let h = max(wrappedArray.length * 18 + 75, 120);

  let currentW = isCompact ? 160 : w;
  let currentH = isCompact ? 50 : h;

  let x = startX || width / 2;
  let y = startY || height / 2;

  let cat = isPinned ? CAT_MEMO : CAT_PIECE;
  let msk = isPinned ? CAT_DEFAULT | CAT_MEMO : CAT_DEFAULT | CAT_PIECE;

  let body = Bodies.rectangle(x, y, currentW, currentH, {
    label: "memo",
    restitution: 0.5,
    frictionAir: isPinned ? 0.4 : 0.05,
    density: 0.005,
    inertia: Infinity,
    id: idStr || Date.now(),
    collisionFilter: {
      category: cat,
      mask: msk,
      group: 0,
    },
  });

  Composite.add(world, body);
  memos.push({
    body: body,
    title: title,
    txt: wrappedStr,
    rawTxt: rawTxt !== null ? rawTxt : txt,
    rawDate: rawDate,
    rawTime: rawTime,
    dateStr: dateStr,
    memoColor: memoColor,
    w: w,
    h: h,
    currentW: currentW,
    currentH: currentH,
    isCompact: isCompact,
    isPinned: isPinned,
    deadlineTime: deadlineTime,
    orderNum: orderNum,
  });
}

function saveMemos() {
  let dataToSave = memos.map((m) => ({
    title: m.title,
    txt: m.txt,
    rawTxt: m.rawTxt,
    rawDate: m.rawDate,
    rawTime: m.rawTime,
    dateStr: m.dateStr,
    memoColor: m.memoColor,
    isPinned: m.isPinned,
    x: m.body.position.x,
    y: m.body.position.y,
    id: m.body.id,
    deadlineTime: m.deadlineTime,
    isCompact: m.isCompact,
    orderNum: m.orderNum,
  }));
  storeItem("Memomemo", dataToSave);
}

function saveLines() {
  let linesToSave = lines.map((l) => ({
    bodyA_id: l.constraint.bodyA.id,
    bodyB_id: l.constraint.bodyB.id,
    name: l.name,
  }));
  storeItem("MemoLines", linesToSave);
}

function searchLines() {
  let keyLine = searchInput.value().trim();
  if (keyLine === "") {
    searchResultDiv.style("display", "none");
    searchedLineName = null;
    return;
  }
  let uniqueNames = [...new Set(lines.map((l) => l.name))].filter((name) =>
    name.includes(keyLine),
  );
  if (uniqueNames.length === 0) {
    searchResultDiv.html(
      `<strong>'${keyLine}'</strong>에 대한 결과가 없습니다.`,
    );
    searchResultDiv.style("display", "block");
    searchedLineName = null;
    return;
  }
  let htmlContent = `<h4>'${keyLine}' 검색 결과</h4><div style="display:flex; flex-direction:column; gap:8px;">`;
  for (let name of uniqueNames) {
    let matched = lines.filter((l) => l.name === name);
    let memoIds = new Set();
    matched.forEach((l) => {
      memoIds.add(l.constraint.bodyA.id);
      memoIds.add(l.constraint.bodyB.id);
    });
    let count = memoIds.size;
    htmlContent += `<button onclick="focusOnLineName('${name}')" style="padding:10px; text-align:left; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:4px; font-size:14px;">
      <strong>${name}</strong> (${count}개 메모)
    </button>`;
  }
  htmlContent += `</div><br><button onclick="closeSearchResult()" style="padding:5px 15px; cursor:pointer;">원래대로 (닫기)</button>`;
  searchResultDiv.html(htmlContent);
  searchResultDiv.style("display", "block");
}

function showAllLinesList() {
  if (lines.length === 0) {
    searchResultDiv.html(`<strong>현재 연결된 선이 없습니다.</strong>`);
    searchResultDiv.style("display", "block");
    searchedLineName = null;
    return;
  }
  let uniqueNames = [...new Set(lines.map((l) => l.name))];
  let htmlContent = `<h4>전체 연결선 목록</h4><div style="display:flex; flex-direction:column; gap:8px;">`;
  for (let name of uniqueNames) {
    let matched = lines.filter((l) => l.name === name);
    let memoIds = new Set();
    matched.forEach((l) => {
      memoIds.add(l.constraint.bodyA.id);
      memoIds.add(l.constraint.bodyB.id);
    });
    let count = memoIds.size;
    htmlContent += `<button onclick="focusOnLineName('${name}')" style="padding:10px; text-align:left; cursor:pointer; background:#f9f9f9; border:1px solid #bbb; border-radius:5px; font-size:14px;">
      <strong>${name}</strong> <span style="color:#666; font-size:12px;">(${count}개 메모)</span>
    </button>`;
  }
  htmlContent += `</div><br><button onclick="closeSearchResult()" style="padding:5px 15px; cursor:pointer;">원래대로 (닫기)</button>`;
  searchResultDiv.html(htmlContent);
  searchResultDiv.style("display", "block");
}

window.focusOnLineName = function (name) {
  searchedLineName = name;
  searchResultDiv.style("display", "none");
};

window.closeSearchResult = function () {
  searchResultDiv.style("display", "none");
  searchInput.value("");
  searchedLineName = null;
};

function openLineNameModal(sourceMemo, targetMemo) {
  pendingConnection = { source: sourceMemo, target: targetMemo };
  let uniqueNames = [...new Set(lines.map((l) => l.name))];
  let html = `<h4 style="margin-top:0;">연결선 이름 선택</h4>`;
  if (uniqueNames.length > 0) {
    html += `<p style="font-size:12px; color:#666; margin-bottom:8px;">기존 연결선 이름 선택:</p><div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">`;
    for (let name of uniqueNames) {
      html += `<button onclick="confirmLineName('${name}')" style="padding:6px 12px; background:#eef4ff; border:1px solid #80a5ff; border-radius:15px; cursor:pointer;">${name}</button>`;
    }
    html += `</div>`;
  }
  html += `<p style="font-size:12px; color:#666; margin-bottom:5px;">새 이름 입력:</p>
    <input type="text" id="newLineInput" placeholder="예: 프로젝트 A" style="width:100%; padding:8px; box-sizing:border-box; margin-bottom:12px;">
    <div style="text-align:right;">
      <button onclick="confirmCustomLineName()" style="padding:6px 14px; background:#fbaf23; color:white; border:none; border-radius:4px; cursor:pointer;">확인</button>
      <button onclick="cancelLineModal()" style="padding:6px 14px; margin-left:6px; cursor:pointer;">취소</button>
    </div>`;
  lineSelectModal.html(html);
  lineSelectModal.style("display", "block");
}

window.confirmLineName = function (chosenName) {
  if (pendingConnection && chosenName.trim() !== "") {
    let newConstraint = Constraint.create({
      bodyA: pendingConnection.source.body,
      bodyB: pendingConnection.target.body,
      length: 220,
      stiffness: 0.5,
      render: { visible: false },
    });
    Composite.add(world, newConstraint);
    lines.push({ constraint: newConstraint, name: chosenName.trim() });

    let network = getConnectedNetwork(pendingConnection.source.body.id);
    let hasOrder = network.some((m) => m.orderNum && m.orderNum > 0);
    if (hasOrder) {
      rearrangeNetwork(pendingConnection.source);
    }

    saveLines();
    saveMemos();
  }
  cancelLineModal();
};

window.confirmCustomLineName = function () {
  let val = document.getElementById("newLineInput").value.trim() || "관련 메모";
  confirmLineName(val);
};

window.cancelLineModal = function () {
  lineSelectModal.style("display", "none");
  pendingConnection = null;
};

window.createLineAutomatically = function (source, target, lineName) {
  let newConstraint = Constraint.create({
    bodyA: source.body,
    bodyB: target.body,
    length: 220,
    stiffness: 0.5,
    render: { visible: false },
  });
  Composite.add(world, newConstraint);
  lines.push({ constraint: newConstraint, name: lineName });

  let network = getConnectedNetwork(source.body.id);
  let hasOrder = network.some((m) => m.orderNum && m.orderNum > 0);
  if (hasOrder) {
    rearrangeNetwork(source);
  }

  saveLines();
  saveMemos();
};

window.openMergeModal = function (source, target, netA, netB) {
  pendingConnection = { source: source, target: target };

  let idsA = new Set(netA.map((m) => m.body.id));
  let idsB = new Set(netB.map((m) => m.body.id));

  let namesA = lines
    .filter(
      (l) => idsA.has(l.constraint.bodyA.id) || idsA.has(l.constraint.bodyB.id),
    )
    .map((l) => l.name);
  let namesB = lines
    .filter(
      (l) => idsB.has(l.constraint.bodyA.id) || idsB.has(l.constraint.bodyB.id),
    )
    .map((l) => l.name);
  let allNames = [...new Set([...namesA, ...namesB])];

  let html = `<h4 style="margin-top:0;">두 연결망 통합</h4>
    <p style="font-size:13px; color:#555;">기존에 있던 두 선을 하나로 합칩니다.<br>어떤 선의 이름으로 통일하시겠습니까?</p>
    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; justify-content:center;">`;
  for (let n of allNames) {
    html += `<button onclick="confirmMerge('${n}')" style="padding:6px 12px; background:#eef4ff; border:1px solid #80a5ff; border-radius:15px; cursor:pointer;">${n}</button>`;
  }
  html += `</div>
    <p style="font-size:12px; color:#666; margin-bottom:5px;">또는 새 이름 지정:</p>
    <input type="text" id="mergeLineInput" placeholder="새로운 이름 입력" style="width:100%; padding:8px; box-sizing:border-box; margin-bottom:12px;">
    <div style="text-align:right;">
      <button onclick="confirmCustomMerge()" style="padding:6px 14px; background:#fbaf23; color:white; border:none; border-radius:4px; cursor:pointer;">통합 확인</button>
      <button onclick="cancelMergeModal()" style="padding:6px 14px; margin-left:6px; cursor:pointer;">취소</button>
    </div>`;

  mergeModal.html(html);
  mergeModal.style("display", "block");
};

window.confirmMerge = function (chosenName) {
  if (pendingConnection && chosenName.trim() !== "") {
    let newConstraint = Constraint.create({
      bodyA: pendingConnection.source.body,
      bodyB: pendingConnection.target.body,
      length: 220,
      stiffness: 0.5,
      render: { visible: false },
    });
    Composite.add(world, newConstraint);
    lines.push({ constraint: newConstraint, name: chosenName.trim() });

    let combinedNet = getConnectedNetwork(pendingConnection.source.body.id);
    let combinedIds = new Set(combinedNet.map((m) => m.body.id));

    for (let l of lines) {
      if (
        combinedIds.has(l.constraint.bodyA.id) ||
        combinedIds.has(l.constraint.bodyB.id)
      ) {
        l.name = chosenName.trim();
      }
    }

    let hasOrder = combinedNet.some((m) => m.orderNum && m.orderNum > 0);
    if (hasOrder) {
      combinedNet.forEach((m) => (m.orderNum = null));
      rearrangeNetwork(pendingConnection.source);
    }
    saveLines();
    saveMemos();
  }
  cancelMergeModal();
};

window.confirmCustomMerge = function () {
  let val = document.getElementById("mergeLineInput").value.trim() || "통합 선";
  confirmMerge(val);
};

window.cancelMergeModal = function () {
  mergeModal.style("display", "none");
  pendingConnection = null;
};

window.openDeleteModal = function (m) {
  targetMemoForDelete = m;
  let html = `<h4 style="margin-top:0;">삭제 옵션</h4>
    <p style="font-size:13px; color:#555; margin-bottom:15px;">이 메모는 첫 번째 메모입니다.<br>어떻게 삭제하시겠습니까?</p>
    <div style="display:flex; justify-content:center; gap:8px;">
      <button onclick="confirmDelete('all')" style="padding:8px 12px; background:#ff4d4d; color:white; border:none; border-radius:4px; font-size:13px; cursor:pointer;">전부 다</button>
      <button onclick="confirmDelete('single')" style="padding:8px 12px; background:#fbaf23; color:white; border:none; border-radius:4px; font-size:13px; cursor:pointer;">이 메모만</button>
      <button onclick="cancelDeleteModal()" style="padding:8px 12px; background:#eee; border:1px solid #ccc; border-radius:4px; font-size:13px; cursor:pointer;">취소</button>
    </div>`;
  deleteModal.html(html);
  deleteModal.style("display", "block");
};

window.confirmDelete = function (type) {
  if (targetMemoForDelete) {
    let m = targetMemoForDelete;
    if (type === "all") {
      let network = getConnectedNetwork(m.body.id);
      let networkIds = new Set(network.map((netM) => netM.body.id));
      for (let netM of network) {
        netM.isPinned = false;
        netM.body.frictionAir = 0.05;
        netM.orderNum = null;

        netM.body.collisionFilter.category = CAT_PIECE;
        netM.body.collisionFilter.mask = CAT_DEFAULT | CAT_PIECE;
        netM.body.collisionFilter.group = 0;
      }
      for (let i = lines.length - 1; i >= 0; i--) {
        if (
          networkIds.has(lines[i].constraint.bodyA.id) ||
          networkIds.has(lines[i].constraint.bodyB.id)
        ) {
          Composite.remove(world, lines[i].constraint);
          lines.splice(i, 1);
        }
      }
      saveLines();
      saveMemos();
    } else if (type === "single") {
      deleteSingleMemo(m);
    }
  }
  cancelDeleteModal();
};

window.cancelDeleteModal = function () {
  deleteModal.style("display", "none");
  targetMemoForDelete = null;
};

window.deleteSingleMemo = function (m) {
  m.isPinned = false;
  m.body.frictionAir = 0.05;
  m.orderNum = null;

  m.body.collisionFilter.category = CAT_PIECE;
  m.body.collisionFilter.mask = CAT_DEFAULT | CAT_PIECE;
  m.body.collisionFilter.group = 0;

  let connectedMemos = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    let l = lines[i];
    if (l.constraint.bodyA.id === m.body.id) {
      connectedMemos.push({ targetBody: l.constraint.bodyB, lineName: l.name });
      Composite.remove(world, l.constraint);
      lines.splice(i, 1);
    } else if (l.constraint.bodyB.id === m.body.id) {
      connectedMemos.push({ targetBody: l.constraint.bodyA, lineName: l.name });
      Composite.remove(world, l.constraint);
      lines.splice(i, 1);
    }
  }

  if (connectedMemos.length === 2) {
    let body1 = connectedMemos[0].targetBody;
    let body2 = connectedMemos[1].targetBody;
    let retainedName = connectedMemos[0].lineName;
    let newConstraint = Constraint.create({
      bodyA: body1,
      bodyB: body2,
      length: 220,
      stiffness: 0.5,
      render: { visible: false },
    });
    Composite.add(world, newConstraint);
    lines.push({ constraint: newConstraint, name: retainedName });

    let targetMemoForRearrange = memos.find((mem) => mem.body.id === body1.id);
    if (targetMemoForRearrange) rearrangeNetwork(targetMemoForRearrange);
  } else if (connectedMemos.length === 1) {
    let targetMemoForRearrange = memos.find(
      (mem) => mem.body.id === connectedMemos[0].targetBody.id,
    );
    if (targetMemoForRearrange) {
      let net = getConnectedNetwork(targetMemoForRearrange.body.id);
      if (net.length <= 1) {
        targetMemoForRearrange.orderNum = null;
      } else {
        rearrangeNetwork(targetMemoForRearrange);
      }
    }
  }
  saveLines();
  saveMemos();
};

function distToSegment(p, v, w) {
  let l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return dist(p.x, p.y, v.x, v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  let projX = v.x + t * (w.x - v.x);
  let projY = v.y + t * (w.y - v.y);
  return dist(p.x, p.y, projX, projY);
}

function mousePressed() {
  if (
    memowrite.style("display") === "block" ||
    lineSelectModal.style("display") === "block" ||
    deleteModal.style("display") === "block" ||
    mergeModal.style("display") === "block"
  )
    return;

  let currentTime = millis();

  if (
    mouseX >= 0 &&
    mouseX <= 80 &&
    mouseY >= height / 2 - 100 &&
    mouseY <= height / 2 + 100
  ) {
    isDraggingNewMemo = true;
    mConstraint.collisionFilter.mask = 0;
    mConstraint.body = null;
    return;
  }

  let allowedIds = null;
  if (searchedLineName !== null) {
    allowedIds = new Set();
    let matchedLines = lines.filter((l) => l.name === searchedLineName);
    matchedLines.forEach((l) => {
      allowedIds.add(l.constraint.bodyA.id);
      allowedIds.add(l.constraint.bodyB.id);
    });

    let clickedAllowed = false;
    for (let m of memos) {
      if (!allowedIds.has(m.body.id)) continue;
      let hw = m.currentW / 2;
      let hh = m.currentH / 2;
      if (
        mouseX > m.body.position.x - hw &&
        mouseX < m.body.position.x + hw &&
        mouseY > m.body.position.y - hh &&
        mouseY < m.body.position.y + hh
      ) {
        clickedAllowed = true;
        break;
      }
    }

    if (!clickedAllowed) {
      for (let l of matchedLines) {
        let v = l.constraint.bodyA.position;
        let w = l.constraint.bodyB.position;
        if (distToSegment({ x: mouseX, y: mouseY }, v, w) < 25) {
          clickedAllowed = true;
          break;
        }
      }
    }

    if (!clickedAllowed) {
      searchedLineName = null;
      return;
    }
  }

  let overMemo = false;

  for (let m of memos) {
    if (allowedIds !== null && !allowedIds.has(m.body.id)) continue;

    let hw = m.currentW / 2;
    let hh = m.currentH / 2;

    let isInsideMemo =
      mouseX > m.body.position.x - hw &&
      mouseX < m.body.position.x + hw &&
      mouseY > m.body.position.y - hh &&
      mouseY < m.body.position.y + hh;

    if (isInsideMemo) {
      overMemo = true;
    }

    if (!m.isPinned) continue;

    if (isInsideMemo) {
      let btnX = m.body.position.x + hw - 13;
      let btnY = m.body.position.y - hh + 13;

      if (dist(mouseX, mouseY, btnX, btnY) < 20) {
        let connectedLines = lines.filter(
          (l) =>
            l.constraint.bodyA.id === m.body.id ||
            l.constraint.bodyB.id === m.body.id,
        );
        let isConnected = connectedLines.length > 0;

        if (isConnected) {
          let isFirst = false;
          if (m.orderNum === 1) isFirst = true;
          else if (!m.orderNum && connectedLines.length === 1) isFirst = true;

          if (isFirst) {
            mConstraint.body = null;
            openDeleteModal(m);
            return;
          } else {
            deleteSingleMemo(m);
            mConstraint.body = null;
            return;
          }
        } else {
          m.isPinned = false;
          m.body.frictionAir = 0.05;
          m.body.collisionFilter.category = CAT_PIECE;
          m.body.collisionFilter.mask = CAT_DEFAULT | CAT_PIECE;
          m.body.collisionFilter.group = 0;
          saveLines();
          saveMemos();
        }
        mConstraint.body = null;
        return;
      }

      let inTopLeftArea =
        mouseX > m.body.position.x - hw &&
        mouseX < m.body.position.x - hw + m.currentW / 3 &&
        mouseY > m.body.position.y - hh &&
        mouseY < m.body.position.y - hh + m.currentH / 3;

      if (inTopLeftArea) {
        isLining = true;
        memoLining = m;
        Body.setStatic(m.body, true);
        mConstraint.body = null;
        return;
      }

      if (isMemoConnected(m.body.id)) {
        let net = getConnectedNetwork(m.body.id);
        let isOrdered = net.some((netM) => netM.orderNum > 0);
        let maxOrder = net.length;

        let btnBaseX = m.body.position.x + hw - 22;
        let btnBaseY = m.body.position.y + hh - 15;

        if (!isOrdered) {
          if (
            mouseX > btnBaseX - 14 &&
            mouseX < btnBaseX + 14 &&
            mouseY > btnBaseY - 9 &&
            mouseY < btnBaseY + 9
          ) {
            mConstraint.body = null;
            m.orderNum = 1;
            rearrangeNetwork(m);
            saveMemos();
            return;
          }
        } else {
          let hasLeft = m.orderNum > 1;
          let hasRight = m.orderNum < maxOrder;

          let leftBtnX = hasRight ? btnBaseX - 12 : btnBaseX;
          let rightBtnX = hasLeft ? btnBaseX + 12 : btnBaseX;

          if (
            hasLeft &&
            mouseX > leftBtnX - 9 &&
            mouseX < leftBtnX + 9 &&
            mouseY > btnBaseY - 9 &&
            mouseY < btnBaseY + 9
          ) {
            mConstraint.body = null;
            let other = net.find((n) => n.orderNum === m.orderNum - 1);
            if (other) {
              other.orderNum = m.orderNum;
              m.orderNum -= 1;
              rearrangeNetwork(m);
              saveMemos();
            }
            return;
          }

          if (
            hasRight &&
            mouseX > rightBtnX - 9 &&
            mouseX < rightBtnX + 9 &&
            mouseY > btnBaseY - 9 &&
            mouseY < btnBaseY + 9
          ) {
            mConstraint.body = null;
            let other = net.find((n) => n.orderNum === m.orderNum + 1);
            if (other) {
              other.orderNum = m.orderNum;
              m.orderNum += 1;
              rearrangeNetwork(m);
              saveMemos();
            }
            return;
          }
        }
      }

      let inBottomCenterArea =
        mouseX > m.body.position.x - 30 &&
        mouseX < m.body.position.x + 30 &&
        mouseY > m.body.position.y + hh - 24 &&
        mouseY < m.body.position.y + hh;

      if (inBottomCenterArea) {
        m.isCompact = !m.isCompact;
        let targetW = m.isCompact ? 160 : m.w;
        let targetH = m.isCompact ? 50 : m.h;

        Body.scale(m.body, targetW / m.currentW, targetH / m.currentH);
        m.currentW = targetW;
        m.currentH = targetH;
        mConstraint.body = null;
        saveMemos();
        return;
      }

      if (
        currentTime - lastClickTime < 300 &&
        lastClickedMemoId === m.body.id
      ) {
        mConstraint.body = null;
        openEditMemo(m);
        return;
      }

      lastClickTime = currentTime;
      lastClickedMemoId = m.body.id;
    }
  }

  if (!overMemo) {
    let p = { x: mouseX, y: mouseY };
    for (let l of lines) {
      if (allowedIds !== null && l.name !== searchedLineName) continue;

      let v = l.constraint.bodyA.position;
      let w = l.constraint.bodyB.position;
      if (distToSegment(p, v, w) < 25) {
        grabbedLine = l;
        mConstraint.body = null;
        return;
      }
    }
  }
}

function mouseReleased() {
  mConstraint.collisionFilter.mask = CAT_DEFAULT | CAT_MEMO | CAT_PIECE;

  if (isDraggingNewMemo) {
    isDraggingNewMemo = false;
    pendingMemoX = mouseX;
    pendingMemoY = mouseY;
    openMemo();
    return;
  }

  if (grabbedLine) {
    grabbedLine = null;
    saveMemos();
    return;
  }

  saveMemos();

  if (isLining && memoLining) {
    Body.setStatic(memoLining.body, false);

    let targetMemo = null;
    for (let m of memos) {
      if (m === memoLining) continue;
      let hw = m.currentW / 2;
      let hh = m.currentH / 2;
      if (
        mouseX > m.body.position.x - hw &&
        mouseX < m.body.position.x + hw &&
        mouseY > m.body.position.y - hh &&
        mouseY < m.body.position.y + hh
      ) {
        targetMemo = m;
        break;
      }
    }

    if (targetMemo) {
      let netA = getConnectedNetwork(memoLining.body.id);
      let netB = getConnectedNetwork(targetMemo.body.id);
      let hasLineA = netA.length > 1;
      let hasLineB = netB.length > 1;
      let isSameNet = netA.some((m) => m.body.id === targetMemo.body.id);

      if (hasLineA && hasLineB && !isSameNet)
        openMergeModal(memoLining, targetMemo, netA, netB);
      else if (hasLineA && !hasLineB) {
        let nameA =
          lines.find(
            (l) =>
              l.constraint.bodyA.id === memoLining.body.id ||
              l.constraint.bodyB.id === memoLining.body.id,
          )?.name || "연결선";
        createLineAutomatically(memoLining, targetMemo, nameA);
      } else if (!hasLineA && hasLineB) {
        let nameB =
          lines.find(
            (l) =>
              l.constraint.bodyA.id === targetMemo.body.id ||
              l.constraint.bodyB.id === targetMemo.body.id,
          )?.name || "연결선";
        createLineAutomatically(memoLining, targetMemo, nameB);
      } else if (isSameNet) {
        let nameSame =
          lines.find((l) =>
            netA.some((m) => m.body.id === l.constraint.bodyA.id),
          )?.name || "연결선";
        createLineAutomatically(memoLining, targetMemo, nameSame);
      } else openLineNameModal(memoLining, targetMemo);
    }
  }
  isLining = false;
  memoLining = null;
}

function shatter(body) {
  if (body.label === "memo") {
    let m = memos.find((memo) => memo.body.id === body.id);
    if (m && !m.isPinned && body.speed > 11) {
      Composite.remove(world, body);
      memos = memos.filter((memo) => memo.body.id !== body.id);
      createPieces(body.position.x, body.position.y);
      saveMemos();
    }
  }
}

function createPieces(x, y) {
  for (let i = 0; i < 20; i++) {
    let pw = int(random(8, 20));
    let piece = Bodies.rectangle(
      x + random(-20, 20),
      y + random(-20, 20),
      pw,
      pw,
      {
        restitution: 0.6,
        frictionAir: 0.02,
        collisionFilter: {
          category: CAT_PIECE,
          mask: CAT_DEFAULT | CAT_PIECE,
          group: 0,
        },
      },
    );
    piece.pw = pw;
    piece.life = 255;
    let forcePower = 0.015 * piece.mass;
    Body.applyForce(piece, piece.position, {
      x: (forcePower + random(0.01)) * random([-1, 1]),
      y: (forcePower + random(0.01)) * random([-1, 1]),
    });
    Composite.add(world, piece);
    pieces.push(piece);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
