import { startDrag, stopDrag } from './dist/index.js'

const dragTarget = document.createElement('h1')
dragTarget.textContent = 'moi'

dragTarget.addEventListener('pointerdown', startDrag)

dragTarget.addEventListener('pointerup', stopDrag)

document.body.appendChild(dragTarget)
