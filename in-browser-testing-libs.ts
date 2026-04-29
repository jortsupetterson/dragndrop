import { drag, startWatch, stopWatch } from './dist/index.js'

const controls: HTMLElement | null = document.querySelector('div.controls')
if (!controls) throw new Error()

const boxes: HTMLElement[] = []
for (let i = 0; i < 10; i++) {
  const box = document.createElement('div')

  box.textContent = `box:${i}`
  box.classList.add(`box:${i}`)

  box.style.cssText = `
width: 100px;
height: 100px;
background: red;
`
  void controls.appendChild(box)

  void box.addEventListener('pointerdown', async (event) => {
    box.style.transition = `transform 0s ease`
    void drag(event, async (dragged, watcher) => {
      const append = () => {
        watcher.appendChild(dragged)
        dragged.removeEventListener('pointerup', append)
      }
      dragged.addEventListener('pointerup', append)
    })
    for (const otherBox of boxes) {
      if (otherBox === box) continue
      void startWatch(otherBox, box)
    }
  })

  void box.addEventListener('pointerup', async () => {
    box.style.transition = `transform 0.5s ease`
    box.style.transform = `translate(0px, 0px)`
    delete box.dataset.x
    delete box.dataset.y
    for (const otherBox of boxes) {
      if (otherBox === box) continue
      void stopWatch(otherBox, box)
    }
  })

  boxes.push(box)
}
