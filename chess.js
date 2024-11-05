//chess.js
import { chess } from './chesslib.js'

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
    this.initializeBoard()
  }

  initializeBoard() {
    this.renderBoard()
  }

  renderBoard() {
    this.chessboardElement.innerHTML = '' // Clear previous board

    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        this.createSquare(row, column)
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
          // Use setTimeout to delay the alert
          setTimeout(() => {
            alert('Draw by 3-fold repetition!')
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true // Mark the game as over
          return
        }

        // Check if move leads to a draw by the fifty-move rule
        if (this.chessGame.isDrawByFiftyMoveRule()) {
          // Use setTimeout to delay the alert
          setTimeout(() => {
            alert('Draw by the fifty-move rule!')
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true // Mark the game as over
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

        // Check for checkmate after the move
        if (this.chessGame.isCheckmate()) {
          // Use setTimeout to delay the alert
          setTimeout(() => {
            alert(
              `${
                this.chessGame.currentPlayerTurn === 'w' ? 'Black' : 'White'
              } wins by checkmate!`,
            )
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true // Mark the game as over
          return
        }

        // Check for stalemate after the move
        if (this.chessGame.isStalemate()) {
          // Use setTimeout to delay the alert
          setTimeout(() => {
            alert('Draw by Stalemate!')
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true // Mark the game as over
          return
        }

        // Check for insufficient material after the move
        if (this.chessGame.isDrawByInsufficientMaterial()) {
          // Use setTimeout to delay the alert
          setTimeout(() => {
            alert('Draw by insufficient material!')
          }, 350) // 1000 milliseconds = 1 seconds
          this.gameOver = true // Mark the game as over
          return
        }
      } catch (error) {
        alert(error.message) // Notify user about the invalid move
        console.log(error)
        this.deselectPiece() // Deselect the piece
      }
    } else {
      this.deselectPiece()
    }
  }

  executeMove(startX, startY, row, column) {
    this.chessGame.makeMove([startX, startY], [row, column]) // Move the piece with the new method
    this.deselectPiece()
    this.renderBoard() // Refresh the board
  }
}

// Initialize the Chess UI
const chessUI = new ChessUI(chess)
