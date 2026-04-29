// dist/index.js
function drag(pointermoveEvent) {
  const target = pointermoveEvent.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  const x = Number(target.dataset.x ?? 0) + pointermoveEvent.movementX;
  const y = Number(target.dataset.y ?? 0) + pointermoveEvent.movementY;
  target.dataset.x = String(x);
  target.dataset.y = String(y);
  target.style.transform = `translate(${x}px, ${y}px)`;
}
function stopDrag(pointerupEvent) {
  const target = pointerupEvent.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  target.removeEventListener("pointermove", drag);
  target.removeEventListener("pointerup", stopDrag);
  target.removeEventListener("pointercancel", stopDrag);
  if (target.hasPointerCapture(pointerupEvent.pointerId)) {
    target.releasePointerCapture(pointerupEvent.pointerId);
  }
}
function startDrag(pointerdownEvent) {
  const target = pointerdownEvent.target;
  if (!(target instanceof HTMLElement)) return;
  target.setPointerCapture(pointerdownEvent.pointerId);
  target.addEventListener("pointermove", drag);
  target.addEventListener("pointerup", stopDrag);
  target.addEventListener("pointercancel", stopDrag);
}

// in-browser-testing-libs.ts
var dragTarget = document.createElement("h1");
dragTarget.textContent = "moi";
dragTarget.addEventListener("pointerdown", startDrag);
dragTarget.addEventListener("pointerup", stopDrag);
document.body.appendChild(dragTarget);
