<template>
  <div class="flex flex-col">
    <div
      class="chessboard"
      ref="chessboard"
      @mousedown="startDrawing"
      @mouseup="stopDrawing"
      @mousemove="drawArrow"
      @contextmenu.prevent
    >
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

        <!-- Only show this line while drawing -->
        <line
          v-if="isDrawingArrow"
          :x1="startX"
          :y1="startY"
          :x2="endX"
          :y2="endY"
          stroke-width="10"
          stroke="red"
          fill="none"
          opacity="0.4"
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
          <polygon points="0.3 0, 2 1.25, 0.3 2.5" fill="red" />
        </marker>
      </svg>
      <div class="chessboard-hidden" ref="chessboard-hidden">
        <div
          v-for="(square, index) in squaresToRender"
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
const chessboard = ref(null)
const squares = SQUARES
const pieces = ref({})
const selectedPiece = ref(null)

const fen = ref(DEFAULT_POSITION)

const chess = new Chess()
const isFlipped = ref(false)

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

// Get the image URL for the piece
const getPieceImage = (piece) => {
  const color = piece.color === 'w' ? 'w' : 'b'
  const pieceType = piece.type.toUpperCase()
  return `/pieces/cardinal/${color}${pieceType}.svg`
}

// Computed property to determine squares order based on flipping
const squaresToRender = computed(() => {
  return isFlipped.value ? squares.slice().reverse() : squares
})

const flipBoard = () => {
  isFlipped.value = !isFlipped.value
}

const startDrag = (square) => {
  selectedPiece.value = square // Track which piece is being dragged
}

const endDrag = () => {
  selectedPiece.value = null // Clear the selected piece when drag ends
}

const dropPiece = (targetSquare) => {
  if (selectedPiece.value) {
    // Attempt to move the piece in chess.js, updating the board state
    const move = chess.move({
      from: selectedPiece.value,
      to: targetSquare,
      promotion: 'q',
    })

    // Only update pieces if the move was valid
    if (move) {
      updatePieces()
    }

    endDrag()
  }
}

const startDrawing = (event) => {
  if (event.button === 2) {
    isDrawingArrow.value = true
    const rect = chessboard.value.getBoundingClientRect()
    startX.value = event.clientX - rect.left
    startY.value = event.clientY - rect.top

    endX.value = startX.value
    endY.value = startY.value
  }
}

const stopDrawing = () => {
  if (isDrawingArrow.value && endX.value !== null && endY.value !== null) {
    arrows.value.push({
      start: { x: startX.value, y: startY.value },
      end: { x: endX.value, y: endY.value },
      color: 'red',
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
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0);
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
}

.square {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.piece {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.arrow {
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
</style>
