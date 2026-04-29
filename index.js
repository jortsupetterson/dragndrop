// dist/index.js
function intersects(a, b) {
  const ar = a.getBoundingClientRect();
  const br = b.getBoundingClientRect();
  return !(ar.right < br.left || ar.left > br.right || ar.bottom < br.top || ar.top > br.bottom);
}
function drag(pointerEvent, onIntersectingStart, onIntersectingStop) {
  const target = pointerEvent.target;
  if (!(target instanceof HTMLElement)) return;
  const watcherClass = `${target.className}-watcher`;
  let watcher;
  let intersecting = false;
  const closestWatcher = (event) => {
    const elements = target.ownerDocument.elementsFromPoint(
      event.clientX,
      event.clientY
    );
    for (const element of elements) {
      if (element instanceof HTMLElement && element !== target) {
        if (element.classList.contains(watcherClass)) return element;
      }
    }
  };
  const move = (event) => {
    const x = Number(target.dataset.x ?? 0) + event.movementX;
    const y = Number(target.dataset.y ?? 0) + event.movementY;
    target.dataset.x = String(x);
    target.dataset.y = String(y);
    target.style.transform = `translate(${x}px, ${y}px)`;
    const nextWatcher = closestWatcher(event);
    const next = nextWatcher ? intersects(target, nextWatcher) : false;
    if (intersecting && (!next || nextWatcher !== watcher) && watcher)
      void onIntersectingStop?.(target, watcher);
    if (next && (!intersecting || nextWatcher !== watcher) && nextWatcher)
      void onIntersectingStart?.(target, nextWatcher);
    watcher = nextWatcher;
    intersecting = next;
  };
  const stop = (event) => {
    void target.removeEventListener("pointermove", move);
    void target.removeEventListener("pointerup", stop);
    void target.removeEventListener("pointercancel", stop);
    if (target.hasPointerCapture(event.pointerId))
      void target.releasePointerCapture(event.pointerId);
  };
  void target.setPointerCapture(pointerEvent.pointerId);
  void target.addEventListener("pointermove", move);
  void target.addEventListener("pointerup", stop);
  void target.addEventListener("pointercancel", stop);
}
function startWatch(watcher, elementToWatch) {
  watcher.classList.add(`${elementToWatch.className}-watcher`);
}
function stopWatch(watcher, elementToWatch) {
  watcher.classList.remove(`${elementToWatch.className}-watcher`);
}

// in-browser-testing-libs.ts
var controls = document.querySelector("div.controls");
if (!controls) throw new Error();
var dragTarget = document.createElement("h1");
dragTarget.textContent = "moi";
dragTarget.classList.add("moi");
void controls.appendChild(dragTarget);
var watchers = [];
for (let i = 0; i < 10; i++) {
  const watcher = document.createElement("div");
  watcher.style.cssText = `
width: 100px;
height: 100px;
background: red;
`;
  void controls.appendChild(watcher);
  watchers.push(watcher);
}
void dragTarget.addEventListener("pointerdown", async (event) => {
  dragTarget.style.transition = `transform 0s ease`;
  void drag(event, async (dragged, watcher) => {
    const append = () => {
      watcher.appendChild(dragged);
      dragged.removeEventListener("pointerup", append);
    };
    dragged.addEventListener("pointerup", append);
  });
  for (const watcher of watchers) {
    void startWatch(watcher, dragTarget);
  }
});
void dragTarget.addEventListener("pointerup", async () => {
  dragTarget.style.transition = `transform 0.5s ease`;
  dragTarget.style.transform = `translate(0px, 0px)`;
  delete dragTarget.dataset.x;
  delete dragTarget.dataset.y;
  for (const watcher of watchers) {
    void stopWatch(watcher, dragTarget);
  }
});
