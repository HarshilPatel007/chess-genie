<template>
  <div class="flex flex-row">
    <div class="flex flex-col">
      <!-- Chessboard start -->
      <div class="chessboard" ref="chessboard" @contextmenu.prevent>
        <div class="chessboard-hidden" ref="chessboard-hidden" @dragover.prevent @drop="drop">
          <div
            v-for="square in currentBoardSquares"
            :key="square"
            class="square"
            :data-square="square"
            @click="removePiece(square)"
            @dragover.prevent
          >
            <img
              v-if="boardState[square]"
              :src="`../../public/pieces/cardinal/${boardState[square]}.svg`"
              :alt="boardState[square]"
              :title="boardState[square]"
              draggable="false"
            />
          </div>
        </div>
        <!-- Chessboard ends -->
      </div>

      <div class="flex flex-row justify-center">
        <input
          type="text"
          :value="generateFEN"
          readonly
          class="w-[380px] border my-1 focus:bg-none border-black focus:outline-none rounded-sm"
        />
      </div>
    </div>

    <!-- Combined Pieces and Turn Section -->
    <div class="flex flex-col ml-4">
      <!-- Combined black and white pieces -->
      <div class="flex flex-row">
        <div class="flex flex-col mr-4">
          <div
            v-for="piece in blackPieces"
            :key="piece"
            class="set-piece"
            :draggable="true"
            @dragstart="dragStart"
          >
            <img
              :src="`../../public/pieces/cardinal/${piece}.svg`"
              :alt="piece"
              :title="piece"
              :data-piece="piece"
            />
          </div>
        </div>
        <div class="flex flex-col">
          <div
            v-for="piece in whitePieces"
            :key="piece"
            class="set-piece"
            :draggable="true"
            @dragstart="dragStart"
          >
            <img
              :src="`../../public/pieces/cardinal/${piece}.svg`"
              :alt="piece"
              :title="piece"
              :data-piece="piece"
            />
          </div>
        </div>
      </div>

      <!-- Combined turn and castling options -->
      <div class="flex flex-col pr-2 rounded-sm mr-2 w-[130px] text-center mt-4">
        <label>
          <input type="radio" value="black" v-model="turn" />
          black's turn
        </label>

        <div class="flex flex-row justify-evenly">
          <label>
            <input type="checkbox" v-model="castlingRights.bQC" title="Queen Side castling" />
            0-0-0
          </label>
          <label>
            <input type="checkbox" v-model="castlingRights.bKC" title="King Side castling" />
            0-0
          </label>
        </div>

        <label>
          <input type="radio" value="white" v-model="turn" />
          white's turn
        </label>

        <div class="flex flex-row justify-evenly">
          <label>
            <input type="checkbox" v-model="castlingRights.wQC" title="Queen Side castling" />
            0-0-0
          </label>
          <label>
            <input type="checkbox" v-model="castlingRights.wKC" title="King Side castling" />
            0-0
          </label>
        </div>
      </div>

      <button
        class="text-gray-600 border my-1 ml-1 border-gray-600 focus:outline-none font-medium rounded-sm text-sm w-[115px]"
        @click="loadFEN"
      >
        load
      </button>
    </div>
  </div>
</template>

<script setup>
import { SQUARES } from 'chess.js'
import { computed, defineEmits, ref } from 'vue'
const pieces = ref(['bP', 'bR', 'bN', 'bB', 'bQ', 'bK', 'wK', 'wQ', 'wB', 'wN', 'wR', 'wP'])
const squares = SQUARES
const boardState = ref({})
const currentBoardSquares = computed(() => squares)

const castlingRights = ref({
  wKC: false, // White King-side
  wQC: false, // White Queen-side
  bKC: false, // Black King-side
  bQC: false, // Black Queen-side
})
const turn = ref('white')
const emits = defineEmits(['loadFEN'])
const loadFEN = () => {
  // Emit the generated FEN value to the parent
  emits('loadFEN', generateFEN.value)
}

const dragStart = (event) => {
  const piece = event.target.getAttribute('data-piece')
  event.dataTransfer.setData('piece', piece)
}

const drop = (event) => {
  const piece = event.dataTransfer.getData('piece')
  const targetSquare = event.target.getAttribute('data-square')

  // Ensure square is not occupied
  if (targetSquare && !boardState.value[targetSquare]) {
    boardState.value[targetSquare] = piece
  }
}

const removePiece = (square) => {
  if (boardState.value[square]) {
    delete boardState.value[square] // Delete the piece at the clicked square
  }
}

// Generate FEN from board state
const generateFEN = computed(() => {
  const rows = []
  for (let rank = 8; rank >= 1; rank--) {
    let row = ''
    let emptySquares = 0

    for (let file = 0; file < 8; file++) {
      const square = `${String.fromCharCode(97 + file)}${rank}`
      const piece = boardState.value[square]

      if (piece) {
        // Append the piece if present
        if (emptySquares > 0) {
          row += emptySquares // Add the number of empty squares
          emptySquares = 0
        }
        // Convert black pieces to lowercase and white pieces to uppercase
        row +=
          piece.charAt(0) === 'b' ? piece.charAt(1).toLowerCase() : piece.charAt(1).toUpperCase()
      } else {
        emptySquares++
      }
    }

    if (emptySquares > 0) {
      row += emptySquares
    }

    rows.push(row)
  }

  const board = rows.join('/')
  const castling =
    `${castlingRights.value.wKC ? 'K' : ''}${castlingRights.value.wQC ? 'Q' : ''}${castlingRights.value.bKC ? 'k' : ''}${castlingRights.value.bQC ? 'q' : ''}` ||
    '-'

  // Update the active turn in the FEN
  return `${board} ${turn.value === 'white' ? 'w' : 'b'} ${castling} - 0 1`
})

// Separate pieces into black and white
const blackPieces = computed(() => pieces.value.filter((piece) => piece.charAt(0) === 'b'))
const whitePieces = computed(() =>
  pieces.value.filter((piece) => piece.charAt(0) === 'w').reverse(),
)
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

.set-piece {
  cursor: grab;
  width: 40px;
  max-width: 100px;
}
</style>
