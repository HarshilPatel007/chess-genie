//chess.js

import { chess } from './chesslib.js'
import { PlayStockfish } from './playstockfish.js'

class ChessUI {
  constructor(chessGame) {
    this.chessGame = chessGame
    this.selectedPiece = null
    this.chessboardElement = document.getElementById('chessboard')
    this.chessPieceMap = {
      K: 'wK',
      Q: 'wQ',
      R: 'wR',
      B: 'wB',
      N: 'wN',
      P: 'wP',
      k: 'bK',
      q: 'bQ',
      r: 'bR',
      b: 'bB',
      n: 'bN',
      p: 'bP',
    }
    this.gameOver = false // Track if the game is over
    this.isFlipped = false // Track if the board is flipped
    this.isBotGame = false // Track if it's a bot game
    this.stockfishAI = null // Placeholder for the Stockfish AI
    this.initializeBoard()
    this.flipChessboard()

    this.showGameModeSelection()
  }

  initializeBoard() {
    this.renderBoard()
  }

  showGameModeSelection() {
    const startGameButton = document.getElementById('startGame')
    startGameButton.addEventListener('click', () => {
      const gameModeModal = new bootstrap.Modal(
        document.getElementById('gameModeModal'),
      )
      gameModeModal.show()

      const stockfishStrengthInput =
        document.getElementById('stockfishStrength')

      // Update Stockfish Level when input changes
      stockfishStrengthInput.addEventListener('input', () => {
        this.updateStockfishLevel(stockfishStrengthInput.value)
      })

      document
        .getElementById('playerVsPlayer')
        .addEventListener('click', () => {
          this.startPlayerVsPlayerGame()
          this.isBotGame = false // Player vs Player
          gameModeModal.hide()
        })

      document
        .getElementById('playerVsBotWhite')
        .addEventListener('click', () => {
          this.startPlayerVsBotGame('w')
          this.isBotGame = true // Player vs Stockfish (White)
          this.updateStockfishLevel(stockfishStrengthInput.value) // Update Stockfish level
          gameModeModal.hide()
        })

      document
        .getElementById('playerVsBotBlack')
        .addEventListener('click', () => {
          this.startPlayerVsBotGame('b')
          this.isBotGame = true // Stockfish (Black)
          this.updateStockfishLevel(stockfishStrengthInput.value) // Update Stockfish level
          gameModeModal.hide()
        })
    })
  }

  updateStockfishLevel(level) {
    if (this.stockfishAI) {
      this.stockfishAI.stockfishLevel = level // Update the level in PlayStockfish
      this.stockfishAI.stockfish.postMessage(
        `setoption name Skill Level value ${level}`,
      ) // Optionally, post the new level to Stockfish
    }
  }

  startPlayerVsPlayerGame() {
    this.isBotGame = false // Set to false for player vs player
    console.log('Starting Player vs Player Game...')
    // Additional logic to reset board and start the game can go here.
  }

  // Update the existing startPlayerVsBotGame method
  startPlayerVsBotGame(playerColor) {
    console.log(`Starting Player vs Bot Game... Player: ${playerColor}`)
    this.stockfishAI = new PlayStockfish(this.chessGame, this) // Pass the ChessUI instance
    if (playerColor === 'b') {
      this.stockfishAI.requestStockfishMove() // If the player is black, request the first move for Stockfish.
    }
  }

  // Method called after player's move to request Stockfish's move
  stockfishMove() {
    if (this.isBotGame && this.chessGame.currentPlayerTurn === 'b') {
      this.stockfishAI.onPlayerMove(this.gameOver)
    } else if (this.isBotGame && this.chessGame.currentPlayerTurn === 'w') {
      this.stockfishAI.onPlayerMove(this.gameOver)
    }
  }

  flipChessboard() {
    const flipButton = document.getElementById('flipBoard')
    flipButton.addEventListener('click', () => {
      this.isFlipped = !this.isFlipped
      this.renderBoard()
    })
  }

  renderBoard() {
    this.chessboardElement.innerHTML = '' // Clear previous board

    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const renderedRow = this.isFlipped ? 7 - row : row
        const renderedColumn = this.isFlipped ? 7 - column : column
        this.createSquare(renderedRow, renderedColumn)
      }
    }
  }

  createSquare(row, column) {
    const squareElement = document.createElement('div')
    squareElement.classList.add(
      'square',
      (row + column) % 2 === 0 ? 'white' : 'black',
    )
    squareElement.dataset.row = row
    squareElement.dataset.col = column

    // Create a text node to display the row, column
    const coordText = document.createElement('span')
    coordText.classList.add('coords')
    coordText.textContent = `(${row}, ${column})`
    squareElement.appendChild(coordText)

    const chessPiece = this.chessGame.board[row][column]
    if (chessPiece) {
      this.createPieceElement(squareElement, chessPiece, row, column)
    }

    squareElement.addEventListener('click', () => this.movePiece(row, column))
    this.chessboardElement.appendChild(squareElement)
  }

  createPieceElement(squareElement, piece, row, column) {
    const pieceImageElement = document.createElement('img')
    pieceImageElement.src = `images/${this.chessPieceMap[piece]}.svg`
    pieceImageElement.alt = piece
    pieceImageElement.classList.add('piece')
    pieceImageElement.addEventListener('click', (event) => {
      event.stopPropagation()
      this.handlePieceClick(row, column)
    })
    squareElement.appendChild(pieceImageElement)
  }

  handlePieceClick(row, column) {
    const piece = this.chessGame.board[row][column]

    if (this.isSelectedPiece(row, column)) {
      this.deselectPiece()
      return
    }

    if (this.isValidPieceSelection(piece)) {
      this.selectPiece(row, column)
    }
  }

  isSelectedPiece(row, column) {
    return (
      this.selectedPiece &&
      this.selectedPiece[0] === row &&
      this.selectedPiece[1] === column
    )
  }

  isValidPieceSelection(piece) {
    if (!piece) return false // No piece in the square

    const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b' // Determine the color of the piece
    return pieceColor === this.chessGame.currentPlayerTurn // Return true only if it's the correct player's turn
  }

  selectPiece(row, column) {
    if (this.selectedPiece) {
      this.deselectPiece() // Deselect if already selected
    }
    this.selectedPiece = [row, column]
    this.highlightSelectedPiece(row, column)
    this.highlightValidMoves(row, column)
  }

  deselectPiece() {
    if (this.selectedPiece) {
      const [row, column] = this.selectedPiece
      this.updateSquareHighlight(row, column, false)
    }
    this.selectedPiece = null
    this.clearHighlights()
  }

  highlightSelectedPiece(row, column) {
    this.updateSquareHighlight(row, column, true)
  }

  updateSquareHighlight(row, column, isHighlighted) {
    const selectedSquare = this.chessboardElement.querySelector(
      `.square[data-row='${row}'][data-col='${column}']`,
    )
    selectedSquare.classList.toggle('selected-square', isHighlighted)
  }

  highlightValidMoves(startX, startY) {
    const validMoves = this.chessGame.getValidMoves([startX, startY])

    validMoves.forEach(([endX, endY]) => {
      const square = this.chessboardElement.querySelector(
        `.square[data-row='${endX}'][data-col='${endY}']`,
      )
      this.createHighlightCircle(square)
    })
  }

  createHighlightCircle(square) {
    const highlightCircle = document.createElement('div')
    highlightCircle.classList.add('highlight-circle')
    square.appendChild(highlightCircle)
  }

  clearHighlights() {
    const highlightedCircles =
      this.chessboardElement.querySelectorAll('.highlight-circle')
    highlightedCircles.forEach((circle) => circle.remove())
  }

  movePiece(row, column) {
    if (!this.selectedPiece || this.gameOver) return // No piece selected or game is over

    const [startX, startY] = this.selectedPiece

    // Check for castling
    if (this.chessGame.isCastlingMove([startX, startY], [row, column])) {
      try {
        this.chessGame.castle([startX, startY], [row, column])
        this.renderBoard() // Refresh the board
        this.deselectPiece()
        this.chessGame.switchTurn()
        this.stockfishMove() // Request Stockfish move if it's a bot game
        return
      } catch (error) {
        alert(error.message) // Notify user about the invalid castling
        console.log(error)
        this.deselectPiece() // Deselect the piece
        return
      }
    }

    const isValidMove = this.chessGame.isValidMove(
      [startX, startY],
      [row, column],
    )

    if (isValidMove) {
      try {
        // Check for draw by threefold repetition before executing the move
        if (this.chessGame.isDrawByRepetition === true) {
          setTimeout(() => {
            alert('Draw by 3-fold repetition!')
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true
          return
        }

        // Check if move leads to a draw by the fifty-move rule
        if (this.chessGame.isDrawByFiftyMoveRule()) {
          setTimeout(() => {
            alert('Draw by the fifty-move rule!')
          }, 350)
          this.gameOver = true
          return
        }
        // Check for en-passant
        if (
          this.chessGame.enPassantTarget &&
          this.chessGame.enPassantTarget[0] === row &&
          this.chessGame.enPassantTarget[1] === column
        ) {
          const capturedRow = startX
          const capturedCol = column
          // Remove the pawn from the board at en-passant target
          this.chessGame.board[capturedRow][capturedCol] = null
        }

        this.executeMove(startX, startY, row, column)
        this.stockfishMove() // Request Stockfish move if it's a bot game

        // Check for checkmate after the move
        if (this.chessGame.isCheckmate()) {
          setTimeout(() => {
            alert(
              `${
                this.chessGame.currentPlayerTurn === 'w' ? 'Black' : 'White'
              } wins by checkmate!`,
            )
          }, 350)
          this.gameOver = true
          return
        }

        // Check for stalemate after the move
        if (this.chessGame.isStalemate()) {
          setTimeout(() => {
            alert('Draw by Stalemate!')
          }, 350)
          this.gameOver = true
          return
        }

        // Check for insufficient material after the move
        if (this.chessGame.isDrawByInsufficientMaterial()) {
          setTimeout(() => {
            alert('Draw by insufficient material!')
          }, 350)
          this.gameOver = true
          return
        }
      } catch (error) {
        alert(error.message) // Notify user about the invalid move
        console.log(error)
        this.deselectPiece()
      }
    } else {
      this.deselectPiece()
    }
  }

  animateMove(pieceSquare, targetSquare) {
    // Get the bounding rectangles for the start and target positions
    const targetRect = targetSquare.getBoundingClientRect()
    const startRect = pieceSquare.getBoundingClientRect()

    // Temporarily remove the piece from the DOM
    pieceSquare.parentElement.removeChild(pieceSquare)

    // Append the piece to the target square to set initial position
    targetSquare.appendChild(pieceSquare)

    // Set the initial position using transforms
    pieceSquare.style.position = 'absolute' // Position the piece to allow transforms

    // Position the piece at the starting square for animation
    pieceSquare.style.left = `${startRect.left - targetRect.left}px`
    pieceSquare.style.top = `${startRect.top - targetRect.top}px`
    pieceSquare.style.zIndex = 10 // Bring piece on top of everything

    // Apply the translation to move the piece to the target square
    requestAnimationFrame(() => {
      pieceSquare.style.transition = 'transform 0.3s ease-in-out'
      pieceSquare.style.transform = `translate(${
        targetRect.left - startRect.left
      }px, ${targetRect.top - startRect.top}px)`
    })

    // Reset the piece properties after the animation completes
    setTimeout(() => {
      // Reset the piece properties after the animation
      pieceSquare.style.position = '' // Restore position
      pieceSquare.style.zIndex = '' // Reset z-index
      pieceSquare.style.transition = '' // Reset transition
      pieceSquare.style.transform = '' // Reset transform
      this.deselectPiece()
      this.renderBoard()
    }, 300) // Wait for the animation duration before executing the move
  }

  executeMove(startX, startY, row, column) {
    const pieceSquare = this.chessboardElement.querySelector(
      `.square[data-row='${startX}'][data-col='${startY}'] .piece`,
    )

    // Calculate the target square's position
    const targetSquare = this.chessboardElement.querySelector(
      `.square[data-row='${row}'][data-col='${column}']`,
    )

    // Ensure that we already have the piece to move, and not create duplicates
    if (!pieceSquare) {
      console.error('No piece found at the starting square.')
      return
    }

    // Call the animateMove method to handle the animation
    this.animateMove(pieceSquare, targetSquare)

    // Move the piece in the chessGame model
    this.chessGame.makeMove([startX, startY], [row, column])
  }
}

// Initialize the Chess UI
const chessUI = new ChessUI(chess)
