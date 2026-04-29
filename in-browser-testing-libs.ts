import { drag, startWatch, stopWatch } from './dist/index.js'

const dragTarget = document.createElement('h1')
dragTarget.textContent = 'moi'
dragTarget.classList.add('moi')
void document.body.appendChild(dragTarget)

const watchers: HTMLElement[] = []
for (let i = 0; i < 10; i++) {
  const watcher = document.createElement('div')

  watcher.style.cssText = `
width: 100px;
height: 100px;
background: red;
`
  void document.body.appendChild(watcher)
  watchers.push(watcher)
}

void dragTarget.addEventListener('pointerdown', async (event) => {
  void drag(event, async (dragged, watcher) => {
    const append = () => {
      watcher.appendChild(dragged)
      dragged.removeEventListener('pointerup', append)
    }
    dragged.addEventListener('pointerup', append)
  })
  for (const watcher of watchers) {
    void startWatch(watcher, dragTarget)
  }
})

void dragTarget.addEventListener('pointerup', async () => {
  dragTarget.style.transform = `translate(0px, 0px)`
  delete dragTarget.dataset.x
  delete dragTarget.dataset.y
  for (const watcher of watchers) {
    void stopWatch(watcher, dragTarget)
  }
})
