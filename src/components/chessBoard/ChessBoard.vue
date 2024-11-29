<template>
  <div class="chessboard" ref="board" @mousedown="startDrag" @mouseup="endDrag">
    <div class="chessboard-hidden" ref="hiddenBoard">
      <!-- Iterate over chessboardSquares to create each cell on the chessboard -->
      <div
        v-for="(square, index) in currentBoardSquares"
        :key="square"
        class="chess-cell"
        :class="{ 'king-check': getKingInCheck(square) }"
        @dragover="handleDragOver"
        @drop="handleDrop(square)"
        @click="handleCellClick(square, $event)"
      >
        <span
          class="square-coordinates"
          :style="{ color: Math.floor(index / 8) % 2 !== index % 2 ? 'white' : 'black' }"
          >{{ square }}</span
        >

        <!-- Highlighted Square -->
        <svg
          v-if="highlightedSquares[square] && highlightedSquares[square].type !== 'move'"
          class="highlight-square"
        >
          <defs>
            <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="0" result="offsetblur" />
              <feFlood flood-color="rgba(0, 0, 0, 0.2)" />
              <feComposite in2="offsetblur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            width="90%"
            height="90%"
            x="3"
            y="3"
            rx="10"
            ry="10"
            fill="none"
            :stroke="highlightedSquares[square].color"
            stroke-width="2.5"
            filter="url(#drop-shadow)"
          />
        </svg>

        <!-- Highlighted move (small circle) -->
        <div
          v-if="highlightedSquares[square] && highlightedSquares[square].type === 'move'"
          class="highlight-circle"
        ></div>

        <!-- Chess piece image -->
        <img
          v-if="boardState[square]"
          :src="`../../public/pieces/${selectedChessPieceSet}/${boardState[square]}.svg`"
          :alt="boardState[square]"
          class="chess-piece"
          :class="{
            selected: selectedCell === square,
          }"
          @dragstart="handleDragStart(square)"
          :draggable="boardState[square] !== null"
          @drag="highlightAttackerSquares"
        />
      </div>
    </div>
  </div>
  <div>
    <button @click="flipBoard">Flip Board</button>
    <select v-model="selectedChessPieceSet">
      <option v-for="[key, value] in Object.entries(chessPieceSet)" :key="key" :value="value">
        {{ value }}
      </option>
    </select>
  </div>
  <div class="move-history">
    <div v-for="(move, index) in moveHistory" :key="index">
      <button class="move-button" @click="navigateToMove(index)">
        {{ move }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { Chess, SQUARES } from 'chess.js'
import { computed, onMounted, ref, watch } from 'vue'

const chess = ref(new Chess())
const boardState = ref({}) // Use an object to map square to pieces.
const highlightedSquares = ref({})
const isFlipped = ref(false)
const selectedCell = ref(null)
const legalMovesForDraggingPiece = ref([])

const moveHistory = ref([])
const moveHistoryFEN = ref([])
const chessBoardSquares = SQUARES
const currentBoardSquares = computed(() =>
  isFlipped.value ? chessBoardSquares.slice().reverse() : chessBoardSquares,
)

const chessPieceSet = { cardinal: 'Cardinal', staunty: 'Staunty', merida: 'Merida' }
const selectedChessPieceSet = ref('Cardinal')

const colors = {
  ctrl: 'blue',
  shift: 'red',
  alt: 'green',
  altShift: 'yellow',
}

const handleDragStart = (square) => {
  if (boardState.value[square]) {
    selectedCell.value = square
    legalMovesForDraggingPiece.value = chess.value
      .moves({ square: square, verbose: true })
      .map((move) => move.to)
    legalMovesForDraggingPiece.value.forEach((move) => {
      highlightedSquares.value[move] = { color: 'green', type: 'move' }
    })
  }
}

const handleDragOver = (event) => {
  event.preventDefault() // Allow the drop
}

const handleDrop = (toSquare) => {
  const validMove = chess.value
    .moves({ square: selectedCell.value, verbose: true })
    .find((move) => move.to === toSquare)
  const fromSquare = selectedCell.value

  if (validMove) {
    handleCastling(validMove)
    handleEnPassant(validMove, toSquare)

    // Move piece
    chess.value.move({ from: fromSquare, to: toSquare })
    // Update boardState
    boardState.value[toSquare] = boardState.value[fromSquare]
    boardState.value[fromSquare] = null

    moveHistory.value.push(validMove.san)
    moveHistoryFEN.value.push(chess.value.fen())
  }
  // Clear highlights after move
  highlightedSquares.value = {}
  selectedCell.value = null
}

const handleCellClick = (square, event) => {
  const existingHighlight = highlightedSquares.value[square]

  const toggleHighlight = (color) => {
    highlightedSquares.value[square] = existingHighlight?.color === color ? null : { color }
  }

  if (event.altKey && event.shiftKey) toggleHighlight(colors.altShift)
  else if (event.ctrlKey) toggleHighlight(colors.ctrl)
  else if (event.shiftKey) toggleHighlight(colors.shift)
  else if (event.altKey) toggleHighlight(colors.alt)
}

const getAttackersAndDefenders = (square) => {
  const currentColor = chess.value.turn() // Get the current player's turn color
  const opponentColor = currentColor === 'w' ? 'b' : 'w' // Get the opponent's color
  const attackers = chess.value.attackers(square, opponentColor)
  const defenders = chess.value.attackers(square)

  return { attackers, defenders }
}

const highlightAttackerSquares = (event) => {
  const squareName = getSquareNameFromMouseEvent(event)

  if (legalMovesForDraggingPiece.value.includes(squareName)) {
    const { attackers } = getAttackersAndDefenders(squareName)

    Object.keys(highlightedSquares.value)
      .filter((square) => highlightedSquares.value[square]?.type === 'attack')
      .forEach((square) => delete highlightedSquares.value[square])

    attackers.forEach((attacker) => {
      highlightedSquares.value[attacker] = { color: 'red', type: 'attack' }
    })
  }
}

const getSquareNameFromMouseEvent = (event) => {
  const boardElement = document.querySelector('.chessboard-hidden')
  const rect = boardElement.getBoundingClientRect()
  const squareSize = rect.width / 8
  const column = isFlipped.value
    ? 7 - Math.floor((event.clientX - rect.left) / squareSize)
    : Math.floor((event.clientX - rect.left) / squareSize)
  const row = isFlipped.value
    ? 7 - Math.floor((event.clientY - rect.top) / squareSize)
    : Math.floor((event.clientY - rect.top) / squareSize)
  return chessBoardSquares[row * 8 + column]
}

// Function to get locations of given piece by name and color
const getPieceLocations = (pieceName, pieceColor) => {
  return chessBoardSquares.filter((square) => {
    const piece = chess.value.get(square)
    return piece && piece.color === pieceColor && piece.type === pieceName
  })
}

// Helper function to get the king's position when in check
const getKingInCheck = (square) => {
  if (chess.value.isCheck()) {
    const kingPosition = getPieceLocations('k', chess.value.turn())[0] // Get the opponent's king position
    return kingPosition === square
  }
  return false
}

// Function to get the king's left and right squares
const getKingAdjacentSquares = (kingPosition) => {
  const file = kingPosition.charAt(0) // Extract the file (letter)
  const rank = parseInt(kingPosition.charAt(1)) // Extract the rank (number)
  const files = 'abcdefgh'.split('') // List of valid files (columns)
  const fileIndex = files.indexOf(file) // Get the index of the king's current file

  return { left: files[fileIndex - 1] + rank, right: files[fileIndex + 1] + rank }
}

// Handle both-side castling - update the rook position
const handleCastling = (validMove) => {
  if (validMove.flags.includes('k') || validMove.flags.includes('q')) {
    const color = validMove.color
    const rookFromSquare = getPieceLocations('r', color)[validMove.flags.includes('k') ? 1 : 0]
    const kingPosition = getPieceLocations('k', color)[0]
    const kingAdjacentSquares = getKingAdjacentSquares(kingPosition)
    const rookToSquare = validMove.flags.includes('k')
      ? kingAdjacentSquares.right
      : kingAdjacentSquares.left

    boardState.value[rookToSquare] = boardState.value[rookFromSquare]
    boardState.value[rookFromSquare] = null
  }
}

// Handle en passant - remove the captured pawn
const handleEnPassant = (validMove, actualToSquare) => {
  if (validMove.flags.includes('e')) {
    const capturedPawnSquare =
      actualToSquare.charAt(0) +
      (parseInt(actualToSquare.charAt(1)) + (chess.value.turn() === 'w' ? -1 : 1))
    boardState.value[capturedPawnSquare] = null
  }
}

const navigateToMove = (index) => {
  // Restore the FEN at the specified index in history
  const fen = moveHistoryFEN.value[index]
  setPositionFromFEN(fen)

  // Optionally, you could update the move history to highlight the selected move
  moveHistory.value.forEach((move, i) => {
    if (i === index) {
      // Add a selected class to highlight the clicked move
      document.querySelectorAll('.move-button')[i].classList.add('selected-move')
    } else {
      document.querySelectorAll('.move-button')[i].classList.remove('selected-move')
    }
  })
}

const setPositionFromFEN = (fen) => {
  chess.value.load(fen) // Load FEN into chess.js

  // Map chess.js pieces to boardState
  for (const square of chessBoardSquares) {
    const piece = chess.value.get(square)
    if (piece) {
      boardState.value[square] = piece.color + piece.type.toUpperCase() // e.g., 'wR', 'bN'
    } else {
      boardState.value[square] = null
    }
  }
}

const flipBoard = () => {
  isFlipped.value = !isFlipped.value
}

// On component mounted, check local storage for piece set
onMounted(() => {
  const storedPieceSet = localStorage.getItem('selectedChessPieceSet')
  if (storedPieceSet) selectedChessPieceSet.value = storedPieceSet
})

// Watch for changes to selectedChessPieceSet and save to local storage
watch(selectedChessPieceSet, (newPieceSet) => {
  localStorage.setItem('selectedChessPieceSet', newPieceSet)
})

// Example FEN position
setPositionFromFEN('rnb1k2r/ppppqppp/5n2/2b1b3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 5')
</script>

<style scoped>
.chessboard {
  width: 500px;
  height: 500px;
  background-image: url('../../public/chessboard/wood4.jpg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
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

.chess-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.chess-piece {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.highlight-square {
  position: absolute;
  width: 100%;
  height: 100%;
}

.selected {
  background-color: rgba(0, 136, 255, 0.461);
}

.draw-arrows {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.square-coordinates {
  position: absolute;
  top: 0.5px;
  right: 0.5px;
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  user-select: none;
}

.king-check {
  background-color: rgba(255, 0, 0, 0.5);
}

.highlight-circle {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 128, 0, 0.8);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.move-history {
  margin-top: 20px;
  display: inline-flex;
}

.move-button {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  color: blue;
  margin: 2px 0;
}

.selected-move {
  background-color: rgba(0, 136, 255, 0.461);
}
</style>
