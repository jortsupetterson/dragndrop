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
  dragTarget.style.transition = `transform 0s ease`
  let append: (() => void) | undefined
  void drag(
    event,
    async (dragged, watcher) => {
      if (append) dragged.removeEventListener('pointerup', append)
      append = () => {
        watcher.appendChild(dragged)
        if (append) dragged.removeEventListener('pointerup', append)
        append = undefined
      }
      dragged.addEventListener('pointerup', append)
    },
    async (dragged) => {
      if (!append) return
      dragged.removeEventListener('pointerup', append)
      append = undefined
    }
  )
  for (const watcher of watchers) {
    void startWatch(watcher, dragTarget)
  }
})

void dragTarget.addEventListener('pointerup', async () => {
  dragTarget.style.transition = `transform 0.5s ease`
  dragTarget.style.transform = `translate(0px, 0px)`
  delete dragTarget.dataset.x
  delete dragTarget.dataset.y
  for (const watcher of watchers) {
    void stopWatch(watcher, dragTarget)
  }
})
