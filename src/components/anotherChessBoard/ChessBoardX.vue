<template>
  <div class="flex flex-col">
    <!-- Chessboard start -->
    <div
      class="chessboard"
      ref="chessboard"
      @mousedown="startDrawing"
      @mouseup="stopDrawing"
      @mousemove="drawArrow"
      @contextmenu.prevent
    >
      <div class="chessboard-hidden" ref="chessboard-hidden">
        <div
          v-for="square in squares"
          :key="square"
          class="square"
          @drop="dropPiece(square)"
          @dragover.prevent
        >
          <p>{{ square }}</p>
          <div
            v-if="pieces[square]"
            class="piece"
            draggable
            @dragstart="startDrag(square)"
            @dragend="endDrag"
          >
            <img :src="getPieceImage(pieces[square])" alt="piece" />
          </div>
        </div>
        <!-- Chessboard ends -->

        <!-- Arrows -->
        <svg ref="svg" class="arrow">
          <g v-for="(arrow, index) in arrows" :key="index">
            <marker
              :id="`arrowhead-${index}`"
              refX="1.25"
              refY="1.25"
              markerWidth="2"
              markerHeight="2.5"
              orient="auto"
            >
              <polygon points="0.3 0, 2 1.25, 0.3 2.5" :fill="arrow.color" />
            </marker>
            <line
              :x1="arrow.start.x"
              :y1="arrow.start.y"
              :x2="arrow.end.x"
              :y2="arrow.end.y"
              :marker-end="`url(#arrowhead-${index})`"
              stroke-width="10"
              :stroke="arrow.color"
              fill="none"
              opacity="0.7"
            />
          </g>

          <!-- show temp arrow while drawing -->
          <g v-if="isDrawingArrow">
            <line
              :x1="startX"
              :y1="startY"
              :x2="endX"
              :y2="endY"
              stroke-width="10"
              :stroke="currentArrow.color"
              fill="none"
              opacity="0.7"
              marker-end="url(#arrowhead-temp)"
            />

            <marker
              id="arrowhead-temp"
              refX="1.25"
              refY="1.25"
              markerWidth="2"
              markerHeight="2.5"
              orient="auto"
            >
              <polygon points="0.3 0, 2 1.25, 0.3 2.5" :fill="currentArrow.color" />
            </marker>
          </g>
        </svg>
      </div>
    </div>
    <button @click="flipBoard" class="mr-1 text-gray-600">
      <font-awesome-icon icon="fa-solid fa-repeat" />
    </button>
  </div>
</template>

<script setup>
import { Chess, DEFAULT_POSITION, SQUARES } from 'chess.js'
import { computed, onMounted, ref } from 'vue'

const isDrawingArrow = ref(false)
const startX = ref(null)
const startY = ref(null)
const endX = ref(null)
const endY = ref(null)
const arrows = ref([])
const currentArrow = ref({ start: null, end: null, color: null })
const chessboard = ref(null)
const pieces = ref({})
const selectedSquare = ref(null)
const fen = ref(DEFAULT_POSITION)
const chess = new Chess()
const isFlipped = ref(false)

const squares = computed(() => {
  return isFlipped.value ? SQUARES.slice().reverse() : SQUARES
})

const colors = {
  ctrl: 'blue',
  shift: 'red',
  alt: 'green',
  altShift: 'yellow',
}

// Set the FEN string to update the board
const setFen = (fenString) => {
  chess.load(fenString)
  updatePieces()
}

// Convert the FEN string into pieces on the chessboard
const updatePieces = () => {
  const board = chess.board()
  const piecesObj = {}
  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      if (square) {
        const squareId = SQUARES[rowIndex * 8 + colIndex]
        piecesObj[squareId] = square
      }
    })
  })
  pieces.value = piecesObj
}

const getPieceImage = (piece) => {
  const color = piece.color === 'w' ? 'w' : 'b'
  const pieceType = piece.type.toUpperCase()
  return `/pieces/cardinal/${color}${pieceType}.svg`
}

const flipBoard = () => {
  isFlipped.value = !isFlipped.value
}

const startDrag = (square) => {
  selectedSquare.value = square
}

const endDrag = () => {
  selectedSquare.value = null
  isDrawingArrow.value = false
  currentArrow.value = { start: null, end: null, color: null }
  arrows.value = []
}

const dropPiece = (targetSquare) => {
  if (selectedSquare.value) {
    const move = chess.move({
      from: selectedSquare.value,
      to: targetSquare,
    })

    if (move) {
      updatePieces()
    }
    endDrag()
  }
}

const startDrawing = (event) => {
  if (event.button === 2) {
    isDrawingArrow.value = true
    if (event.altKey && event.shiftKey) currentArrow.value.color = colors.altShift
    else if (event.ctrlKey) currentArrow.value.color = colors.ctrl
    else if (event.shiftKey) currentArrow.value.color = colors.shift
    else if (event.altKey) currentArrow.value.color = colors.alt
    else currentArrow.value.color = colors.ctrl

    const rect = chessboard.value.getBoundingClientRect()
    const squareSize = rect.width / 8
    const x = Math.floor((event.clientX - rect.left) / squareSize)
    const y = Math.floor((event.clientY - rect.top) / squareSize)

    startX.value = (x + 0.5) * squareSize
    startY.value = (y + 0.5) * squareSize

    endX.value = startX.value
    endY.value = startY.value

    currentArrow.value = {
      start: { x: startX.value, y: startY.value },
      end: { x: endX.value, y: endY.value },
      color: currentArrow.value.color,
    }
  }
}

const stopDrawing = () => {
  const newArrow = {
    start: { x: startX.value, y: startY.value },
    end: { x: endX.value, y: endY.value },
    color: currentArrow.value.color,
  }
  if (arrows.value && currentArrow.value && isDrawingArrow.value) {
    // Check for existing arrows that match the new arrow
    const existingArrowIndex = arrows.value.findIndex(
      (arrow) =>
        arrow.start.x === newArrow.start.x &&
        arrow.start.y === newArrow.start.y &&
        arrow.end.x === newArrow.end.x &&
        arrow.end.y === newArrow.end.y &&
        arrow.color === newArrow.color,
    )

    if (existingArrowIndex !== -1) {
      // Remove the existing arrow of the same color and position
      arrows.value.splice(existingArrowIndex, 1)
    } else {
      arrows.value.push(newArrow)
    }

    isDrawingArrow.value = false
    startX.value = null
    startY.value = null
    endX.value = null
    endY.value = null
    currentArrow.value = { start: null, end: null, color: null }
  }
}

const drawArrow = (event) => {
  if (!isDrawingArrow.value) return
  const rect = chessboard.value.getBoundingClientRect()
  const squareSize = rect.width / 8
  const x = Math.floor((event.clientX - rect.left) / squareSize)
  const y = Math.floor((event.clientY - rect.top) / squareSize)

  endX.value = (x + 0.5) * squareSize
  endY.value = (y + 0.5) * squareSize
}

onMounted(() => {
  setFen(fen.value)
})
</script>

<style scoped>
.chessboard {
  width: 400px;
  height: 400px;
  user-select: none;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-image: url('../../public/chessboard/brown.png');
}

.chessboard-hidden {
  width: 100%;
  height: 100%;
  display: grid;
  position: absolute;
  grid-template-rows: repeat(8, 1fr);
  grid-template-columns: repeat(8, 1fr);
  background-color: rgba(255, 255, 255, 0);
}

.square {
  width: 100%;
  height: 100%;
  display: flex;
  cursor: pointer;
  position: relative;
  align-items: center;
  justify-content: center;
}

.piece {
  width: 100%;
  height: 100%;
  display: flex;
  position: absolute;
  align-items: center;
  justify-content: center;
}

.arrow {
  z-index: 1;
  width: 100%;
  height: 100%;
  position: absolute;
  pointer-events: none;
}
</style>
