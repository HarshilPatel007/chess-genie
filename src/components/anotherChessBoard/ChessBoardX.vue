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
          <line
            v-if="isDrawingArrow"
            :x1="startX"
            :y1="startY"
            :x2="endX"
            :y2="endY"
            stroke-width="10"
            :stroke="currentArrowColor"
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
            <polygon points="0.3 0, 2 1.25, 0.3 2.5" :fill="currentArrowColor" />
          </marker>
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
const currentArrowColor = ref(null)
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
    if (event.altKey && event.shiftKey) currentArrowColor.value = colors.altShift
    else if (event.ctrlKey) currentArrowColor.value = colors.ctrl
    else if (event.shiftKey) currentArrowColor.value = colors.shift
    else if (event.altKey) currentArrowColor.value = colors.alt
    else currentArrowColor.value = colors.ctrl

    const rect = chessboard.value.getBoundingClientRect()
    startX.value = event.clientX - rect.left
    startY.value = event.clientY - rect.top

    endX.value = startX.value
    endY.value = startY.value
  }
}

const stopDrawing = () => {
  if (
    isDrawingArrow.value &&
    endX.value !== null &&
    endY.value !== null &&
    currentArrowColor.value !== null
  ) {
    arrows.value.push({
      start: { x: startX.value, y: startY.value },
      end: { x: endX.value, y: endY.value },
      color: currentArrowColor.value,
    })
  }
  isDrawingArrow.value = false
  startX.value = null
  startY.value = null
  endX.value = null
  endY.value = null
}

const drawArrow = (event) => {
  if (!isDrawingArrow.value) return
  const rect = chessboard.value.getBoundingClientRect()
  endX.value = event.clientX - rect.left
  endY.value = event.clientY - rect.top
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
