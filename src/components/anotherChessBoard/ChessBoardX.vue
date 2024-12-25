<template>
  <div class="flex flex-col border border-red-500">
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
          :class="{
            'king-check': getKingInCheck(square),
            'last-move': lastMoveInfo.from === square || lastMoveInfo.to === square,
            'selected-square': selectedSquare === square,
          }"
          @drop="dropPiece(square)"
          @dragover.prevent
          @mousedown="handleSquareClick(square, $event)"
        >
          <!-- Highlight Square -->
          <svg v-if="squareHighlight[square]" class="highlight-square">
            <rect
              width="90%"
              height="90%"
              x="3"
              y="3"
              rx="10"
              ry="10"
              fill="none"
              :stroke="squareHighlight[square].color"
              stroke-width="2.5"
            />
          </svg>
          <!-- <p>{{ square }}</p> -->
          <div
            v-if="pieces[square]"
            class="piece"
            draggable
            @dragstart="startDrag(square)"
            @dragend="endDrag"
          >
            <img :src="getPieceImage(pieces[square])" alt="piece" />
          </div>
          <!-- Highlighting legal moves -->
          <div v-if="legalMoves.includes(square)" class="legal-moves"></div>
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
      <BoardEditor v-if="showEditor" @loadFEN="setFen" />
    </div>
    <PawnPromotionDialog
      :isVisible="isPromotionVisible"
      :promotePawn="promotePawn"
      :playerTurn="chess.turn()"
    />
    <ResultDialog :isVisible="isResultVisible" :result="resultMsg" />

    <div class="flex justify-end mt-10">
      <button @click="showEditor = !showEditor" class="mr-1 text-gray-600">
        <font-awesome-icon icon="fa-solid fa-chess-board" />
      </button>
      <button @click="flipBoard" class="mr-1 text-gray-600">
        <font-awesome-icon icon="fa-solid fa-repeat" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { Chess, SQUARES } from 'chess.js'
import { computed, onMounted, ref } from 'vue'
import BoardEditor from './BoardEditor.vue'
import PawnPromotionDialog from './PawnPromotionDialog.vue'
import ResultDialog from './ResultDialog.vue'

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
// const fen = ref(DEFAULT_POSITION)
const fen = ref('6k1/5pp1/7p/1PR5/8/6P1/pPpr1r1P/6K1 b - - 0 28')
const chess = new Chess()
const isFlipped = ref(false)
const legalMoves = ref([])
const isPromotionVisible = ref(false)
const promotionToSquare = ref(null)
const promotionFromSquare = ref(null)
const isResultVisible = ref(false)
const resultMsg = ref('')
const squareHighlight = ref({})
const showEditor = ref(false)

const lastMoveInfo = ref({
  from: null,
  to: null,
  piece: null,
  color: null,
  san: null,
  before: null,
  after: null,
  flag: null,
})

const squares = computed(() => {
  return isFlipped.value ? SQUARES.slice().reverse() : SQUARES
})

const colors = {
  ctrl: 'teal',
  shift: 'red',
  alt: 'green',
  altShift: 'darkorange',
}

const handleSquareClick = (square, event) => {
  const existingHighlight = squareHighlight.value[square]
  const toggleHighlight = (color) => {
    squareHighlight.value[square] = existingHighlight?.color === color ? null : { color }
  }
  if (event.button === 0) {
    if (event.altKey && event.shiftKey) toggleHighlight(colors.altShift)
    else if (event.altKey) toggleHighlight(colors.alt)
    else if (event.ctrlKey) toggleHighlight(colors.ctrl)
    else if (event.shiftKey) toggleHighlight(colors.shift)
    else return
  }
}

// Set the FEN string to update the board
const setFen = (fenString) => {
  chess.load(fenString)
  updatePieces()
}

// Convert the FEN string into pieces on the chessboard
const updatePieces = () => {
  // Updates pieces state by mapping the chess board, creating an object for each square with a piece,
  // and filters out squares without pieces, reducing it into a single object containing all pieces.

  const board = chess.board()
  pieces.value = board
    .flatMap((row, rowIndex) =>
      row.map((square, colIndex) => {
        if (square) {
          const squareId = SQUARES[rowIndex * 8 + colIndex]
          return { [squareId]: square }
        }
        return null
      }),
    )
    .filter(Boolean)
    .reduce((accumulator, current) => ({ ...accumulator, ...current }), {})
}

// Function to get locations of given piece by name and color
const getPieceLocations = (color, type) => {
  const board = chess.board()
  const pieces = board
    .flat()
    .filter((square) => square !== null && square.color === color && square.type === type)

  return pieces.map((piece) => piece.square)
}

// Function to get the opponent's king's position when in check
const getKingInCheck = (square) => {
  if (chess.isCheck()) {
    const kingPosition = getPieceLocations(chess.turn(), 'k')[0]
    return kingPosition === square
  }
  return false
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
  legalMoves.value = chess.moves({ square, verbose: true }).map((move) => move.to)
}

const endDrag = () => {
  selectedSquare.value = null
  isDrawingArrow.value = false
  currentArrow.value = { start: null, end: null, color: null }
  arrows.value = []
  legalMoves.value = []
}

const dropPiece = (targetSquare) => {
  if (selectedSquare.value) {
    const validMove = chess
      .moves({ square: selectedSquare.value, verbose: true })
      .find((move) => move.to === targetSquare)
    if (validMove) {
      // Handle pawn promotion
      if (validMove.piece === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')) {
        isPromotionVisible.value = true
        promotionToSquare.value = targetSquare
        promotionFromSquare.value = selectedSquare.value
        return
      }
      const move = chess.move({
        from: selectedSquare.value,
        to: targetSquare,
      })
      updatePieces()
      lastMoveInfo.value = {
        from: move.from,
        to: move.to,
        piece: move.piece,
        color: move.color,
        san: move.san,
        before: move.before,
        after: move.after,
        flag: move.flags,
      }
      checkGameResult()
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
    else currentArrow.value.color = colors.alt

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

const promotePawn = (piece) => {
  const validMove = chess
    .moves({ square: promotionFromSquare.value, verbose: true })
    .find((move) => move.to === promotionToSquare.value)
  if (validMove) {
    const move = chess.move({
      from: promotionFromSquare.value,
      to: promotionToSquare.value,
      promotion: piece,
    })

    updatePieces()
    lastMoveInfo.value = {
      from: move.from,
      to: move.to,
      piece: move.piece,
      color: move.color,
      san: move.san,
      before: move.before,
      after: move.after,
      flag: move.flags,
    }
  }
  isPromotionVisible.value = false
  promotionFromSquare.value = null
  promotionToSquare.value = null
  endDrag()
  checkGameResult()
}

const checkGameResult = () => {
  if (chess.isGameOver()) {
    const result = chess.isCheckmate()
      ? `${chess.turn() === 'w' ? 'Black' : 'White'} wins by Checkmate!`
      : chess.isStalemate()
        ? 'Stalemate!'
        : chess.isInsufficientMaterial()
          ? 'Draw by Insufficient Material!'
          : chess.isThreefoldRepetition()
            ? 'Draw by 3-fold Repetition!'
            : ''
    showGameResultDialog(result)
  }
}

const showGameResultDialog = (resultMessage) => {
  resultMsg.value = resultMessage
  isResultVisible.value = true
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

.king-check {
  background: radial-gradient(
    ellipse at center,
    rgba(255, 0, 0, 1) 0%,
    rgba(231, 0, 0, 1) 25%,
    rgba(221, 0, 0, 1) 45%,
    rgba(169, 0, 0, 0) 80%,
    rgba(158, 0, 0, 0) 100%
  );
}

.last-move {
  background-color: rgba(155, 199, 0, 0.41);
}

.selected-square {
  background-color: rgba(20, 85, 30, 0.5);
}

.highlight-square {
  width: 100%;
  height: 100%;
  position: absolute;
}

.legal-moves {
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 128, 0, 0.8);
}
</style>
