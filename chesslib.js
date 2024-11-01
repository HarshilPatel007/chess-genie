// chesslib.js
const WHITE = 'w'
const BLACK = 'b'

class ChessGame {
  constructor(fenNotation) {
    const [board, playerTurn] = fenNotation.split(' ')
    this.currentPlayerTurn = playerTurn
    this.board = this.initializeBoard(board)
    this.enPassantTarget = null // Initialize en-passant target
    this.moveHistory = [] // To track board position history
    this.drawByRepetition = false // To track if a draw by repetition occurred

    this.repetitionCountTwoTracker = 0

    // Use an object to encapsulate the state of various pieces
    this.pieceMovedStatus = {
      whiteKing: false,
      whiteKingsideRook: false,
      whiteQueensideRook: false,
      blackKing: false,
      blackKingsideRook: false,
      blackQueensideRook: false,
    }
  }

  initializeBoard(fenNotation) {
    const chessBoard = Array.from({ length: 8 }, () => Array(8).fill(null))
    const rows = fenNotation.split('/')

    rows.forEach((row, rowIndex) => {
      let fileIndex = 0
      for (const char of row) {
        if (isNaN(char)) {
          chessBoard[rowIndex][fileIndex++] = char // Place the piece
        } else {
          fileIndex += parseInt(char, 10) // Skip squares
        }
      }
    })

    console.log(this.currentPlayerTurn)

    return chessBoard
  }

  getPiece(x, y) {
    return this.board[x][y] // Access a piece
  }

  setPiece(x, y, piece) {
    this.board[x][y] = piece // Set a piece
  }

  removePiece(x, y) {
    this.setPiece(x, y, null) // Remove a piece
  }

  getPieceColor(piece) {
    if (!piece) {
      return null // If the piece is null, return null
    }
    return piece === piece.toUpperCase() ? WHITE : BLACK // Return WHITE for white, BLACK for black
  }

  isPathClear(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end

    // Check if the positions are on the board
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) return false

    const [stepX, stepY] = this.getStepDirection(start, end)
    let currentX = startX + stepX
    let currentY = startY + stepY

    while (currentX !== endX || currentY !== endY) {
      if (
        !this.isOnBoard([currentX, currentY]) ||
        this.getPiece(currentX, currentY) !== null
      ) {
        return false // If there's any piece in the way or out of bounds
      }
      currentX += stepX
      currentY += stepY
    }
    return true // Path is clear
  }

  isOnBoard(position) {
    // Must be an array of two numbers
    return (
      Array.isArray(position) &&
      position.length === 2 &&
      position[0] >= 0 &&
      position[0] < 8 &&
      position[1] >= 0 &&
      position[1] < 8
    )
  }

  getStepDirection([startX, startY], [endX, endY]) {
    const deltaX = Math.sign(endX - startX)
    const deltaY = Math.sign(endY - startY)
    return [deltaX, deltaY]
  }

  isValidBishopMove(start, end) {
    return this.isDiagonalMove(start, end) && this.isPathClear(start, end)
  }

  isValidRookMove(start, end) {
    return this.isStraightMove(start, end) && this.isPathClear(start, end)
  }

  isValidQueenMove(start, end) {
    return (
      this.isValidBishopMove(start, end) || this.isValidRookMove(start, end)
    )
  }

  isValidKnightMove([startX, startY], [endX, endY]) {
    const deltaX = Math.abs(startX - endX)
    const deltaY = Math.abs(startY - endY)
    return (deltaX === 2 && deltaY === 1) || (deltaX === 1 && deltaY === 2)
  }

  isValidPawnMove([startX, startY], [endX, endY]) {
    const direction = this.getPiece(startX, startY) === 'P' ? -1 : 1 // White up (-1), Black down (+1)
    const targetPiece = this.getPiece(endX, endY)

    // En-passant capture
    if (
      this.enPassantTarget &&
      this.enPassantTarget[0] === endX &&
      this.enPassantTarget[1] === endY
    ) {
      const nextRow = startX + direction
      return (
        targetPiece === null &&
        endX === nextRow &&
        Math.abs(endY - startY) === 1
      )
    }

    // Single move forward
    if (
      endX === startX + direction &&
      endY === startY &&
      targetPiece === null
    ) {
      return true
    }

    // Capture move (diagonal)
    if (endX === startX + direction && Math.abs(endY - startY) === 1) {
      return (
        targetPiece !== null &&
        this.getPieceColor(targetPiece) !==
          this.getPieceColor(this.getPiece(startX, startY))
      )
    }

    // Double move
    if (
      endX === startX + 2 * direction &&
      endY === startY &&
      targetPiece === null &&
      this.board[startX + direction][startY] === null &&
      startX === (direction === -1 ? 6 : 1)
    ) {
      return true
    }

    return false // Invalid move
  }

  promotePawn(position) {
    const piece = this.getPiece(position[0], position[1])
    if (
      piece.toLowerCase() === 'p' &&
      (position[0] === 0 || position[0] === 7)
    ) {
      return true // Promotion is valid
    }
    return false
  }

  findPiecePosition(pieceName, playerColor) {
    const piece =
      playerColor === WHITE ? pieceName.toUpperCase() : pieceName.toLowerCase() // Determine the piece by color
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (this.getPiece(x, y) === piece) {
          return [x, y] // Return the position of the piece
        }
      }
    }
    return null // Piece not found, should not happen in a valid game
  }

  isValidKingMove([startX, startY], [endX, endY]) {
    const deltaX = Math.abs(startX - endX)
    const deltaY = Math.abs(startY - endY)
    const targetPiece = this.getPiece(endX, endY)
    const currentPieceColor = this.getPieceColor(this.getPiece(startX, startY))
    const targetPieceColor = targetPiece
      ? this.getPieceColor(targetPiece)
      : null

    return (
      deltaX <= 1 &&
      deltaY <= 1 && // Move one square in any direction
      (targetPiece === null || targetPieceColor !== currentPieceColor) // Check if target space is empty or occupied by an enemy piece
    )
  }

  isSquareAttacked(position) {
    const opponentColor = this.currentPlayerTurn === WHITE ? BLACK : WHITE

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (piece && this.getPieceColor(piece) === opponentColor) {
          if (this.validatePieceMove(piece, [x, y], position)) {
            return true
          }
        }
      }
    }

    return false
  }

  canCastleKingside() {
    const playerColor = this.currentPlayerTurn === WHITE ? 'white' : 'black'
    return (
      !this.pieceMovedStatus[`${playerColor}King`] && // King has not moved
      !this.pieceMovedStatus[`${playerColor}KingsideRook`] && // Rook has not moved
      this.isPathClear(
        [this.getRowForColor(this.currentPlayerTurn), 4],
        [this.getRowForColor(this.currentPlayerTurn), 6],
      ) // The path between king and rook must be clear
    )
  }

  canCastleQueenside() {
    const playerColor = this.currentPlayerTurn === WHITE ? 'white' : 'black'
    return (
      !this.pieceMovedStatus[`${playerColor}King`] && // King has not moved
      !this.pieceMovedStatus[`${playerColor}QueensideRook`] && // Rook has not moved
      this.isPathClear(
        [this.getRowForColor(this.currentPlayerTurn), 4],
        [this.getRowForColor(this.currentPlayerTurn), 2],
      ) // The path between king and rook must be clear
    )
  }

  getRowForColor(color) {
    return color === WHITE ? 7 : 0
  }

  isCastlingMove(start, end) {
    const piece = this.getPiece(start[0], start[1])

    // Check if the piece is a king and if the target position is valid for castling
    if (
      (piece && piece.toLowerCase() === 'k') ||
      (piece && piece.toUpperCase() === 'K')
    ) {
      if (
        (start[0] === this.getRowForColor(WHITE) &&
          start[1] === 4 &&
          end[0] === this.getRowForColor(WHITE) &&
          end[1] === 6) ||
        (start[0] === this.getRowForColor(BLACK) &&
          start[1] === 4 &&
          end[0] === this.getRowForColor(BLACK) &&
          end[1] === 6)
      ) {
        return 'kingside' // Kingside castling
      }

      if (
        (start[0] === this.getRowForColor(WHITE) &&
          start[1] === 4 &&
          end[0] === this.getRowForColor(WHITE) &&
          end[1] === 2) ||
        (start[0] === this.getRowForColor(BLACK) &&
          start[1] === 4 &&
          end[0] === this.getRowForColor(BLACK) &&
          end[1] === 2)
      ) {
        return 'queenside' // Queenside castling
      }
    }

    return null // Not a castling move
  }

  castle(start, end) {
    const row = this.getRowForColor(this.currentPlayerTurn) // Get the row for the current player
    const castlingType = this.isCastlingMove(start, end) // Determine if it's a kingside or queenside castling

    if (!castlingType) return // Exit if not a castling move

    const kingInitialPosition = [row, 4]
    const rookInitialPosition =
      castlingType === 'kingside' ? [row, 7] : [row, 0]
    const kingNewPosition = castlingType === 'kingside' ? [row, 6] : [row, 2]
    const rookNewPosition = castlingType === 'kingside' ? [row, 5] : [row, 3]

    const king = this.getPiece(...kingInitialPosition) // Get the King
    const rook = this.getPiece(...rookInitialPosition) // Get the Rook

    // Check if the castling move is valid
    if (!this.canCastleKingside() && castlingType === 'kingside') {
      return // Exit if kingside castling is not possible
    }

    if (!this.canCastleQueenside() && castlingType === 'queenside') {
      return // Exit if queenside castling is not possible
    }

    // Temporarily move pieces to validate the castling path
    this.setPiece(...kingNewPosition, king) // Move King's new position
    this.setPiece(...rookNewPosition, rook) // Move Rook's new position
    this.removePiece(...kingInitialPosition) // Remove King from e1/e8
    this.removePiece(...rookInitialPosition) // Remove Rook from its initial position

    // Check if the new positions are attacked
    const kingSafe = !this.isSquareAttacked(kingNewPosition)

    // Undo the temporary moves
    this.removePiece(...kingNewPosition) // Remove King from new position
    this.removePiece(...rookNewPosition) // Remove Rook from new position
    this.setPiece(...kingInitialPosition, king) // Restore King to its initial position
    this.setPiece(...rookInitialPosition, rook) // Restore Rook to its initial position

    // If the King’s new position is not safe, abort castling
    if (!kingSafe) {
      return
    }

    // Proceed with the final castling move
    this.setPiece(...kingNewPosition, king) // Place King in the new position
    this.setPiece(...rookNewPosition, rook) // Place Rook in the new position
    this.removePiece(...kingInitialPosition) // Remove King from e1/e8
    this.removePiece(...rookInitialPosition) // Remove Rook from its initial position

    // Update the movability status for castling
    this.updateCastlingMoveStatus(castlingType) // Update king & rook moved status
    this.switchTurn() // Switch turn after castling
  }

  updateCastlingMoveStatus(castlingDirection) {
    if (this.currentPlayerTurn === WHITE) {
      if (castlingDirection === 'kingside') {
        this.pieceMovedStatus.whiteKing = true
        this.pieceMovedStatus.whiteKingsideRook = true
      } else {
        this.pieceMovedStatus.whiteKing = true
        this.pieceMovedStatus.whiteQueensideRook = true
      }
    } else {
      if (castlingDirection === 'kingside') {
        this.pieceMovedStatus.blackKing = true
        this.pieceMovedStatus.blackKingsideRook = true
      } else {
        this.pieceMovedStatus.blackKing = true
        this.pieceMovedStatus.blackQueensideRook = true
      }
    }
  }

  isDiagonalMove(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end
    return Math.abs(startX - endX) === Math.abs(startY - endY)
  }

  isStraightMove(start, end) {
    const [startX, startY] = start
    const [endX, endY] = end
    return startX === endX || startY === endY
  }

  switchTurn() {
    this.currentPlayerTurn = this.currentPlayerTurn === WHITE ? BLACK : WHITE
  }

  validatePieceMove(piece, start, end) {
    if (!this.isOnBoard(start) || !this.isOnBoard(end)) {
      return false // Invalid move if start or end is off the board
    }

    // Temporarily make the move
    const originalPiece = this.getPiece(start[0], start[1])
    const targetPiece = this.getPiece(end[0], end[1])

    // Ensure there is indeed a piece at start position before attempting the move
    if (originalPiece === null) {
      return false // No piece to move
    }
    // Execute the move
    this.setPiece(end[0], end[1], originalPiece)
    this.removePiece(start[0], start[1])

    // Check if the king is still safe
    const kingPosition = this.findPiecePosition('K', this.currentPlayerTurn)
    const isKingSafe = !this.isSquareAttacked(kingPosition)

    // Undo the temporary move
    this.setPiece(start[0], start[1], originalPiece)
    this.setPiece(end[0], end[1], targetPiece)

    // If the king is in check after the move, return false
    if (!isKingSafe) {
      return false
    }

    // Now validate the specific piece move logic
    switch (piece.toLowerCase()) {
      case 'p':
        return this.isValidPawnMove(start, end)
      case 'r':
        return this.isValidRookMove(start, end)
      case 'n':
        return this.isValidKnightMove(start, end)
      case 'b':
        return this.isValidBishopMove(start, end)
      case 'q':
        return this.isValidQueenMove(start, end)
      case 'k':
        return this.isValidKingMove(start, end)
      default:
        return false // Invalid piece type
    }
  }

  isValidMove(start, end) {
    const piece = this.getPiece(start[0], start[1])

    // Check if there's a piece in the starting position
    if (piece === null) {
      return false // No piece at start
    }

    const pieceColor = this.getPieceColor(piece) // Determine color of the piece

    if (pieceColor !== this.currentPlayerTurn) {
      return false // Not the piece's turn
    }

    const targetPiece = this.getPiece(end[0], end[1])
    if (
      targetPiece !== null &&
      this.getPieceColor(targetPiece) === pieceColor
    ) {
      return false // Can't capture your own piece
    }

    return this.validatePieceMove(piece, start, end)
  }

  makeMove(start, end) {
    const piece = this.getPiece(start[0], start[1])
    const pieceColor = this.getPieceColor(piece)
    const playerColor = this.currentPlayerTurn === WHITE ? 'white' : 'black'

    if (pieceColor !== this.currentPlayerTurn) {
      throw new Error("It's not your turn!")
    }

    if (!this.validatePieceMove(piece, start, end)) {
      throw new Error('Invalid move!')
    }

    const boardState = this.getBoardState()
    this.moveHistory.push(boardState) // Store the current board state in history

    // Count occurrences of the current board state
    const repetitionCount = this.moveHistory.filter(
      (state) => state === boardState,
    ).length

    // Move the piece
    this.setPiece(end[0], end[1], piece)
    this.removePiece(start[0], start[1])

    // Track if king or rook moves
    if (piece.toLowerCase() === 'k') {
      // King moved
      this.pieceMovedStatus[`${playerColor}King`] = true
    } else if (piece.toLowerCase() === 'r') {
      // Rook moved
      if (pieceColor === WHITE) {
        if (start[0] === this.getRowForColor(WHITE) && start[1] === 0) {
          // White Queenside rook
          this.pieceMovedStatus.whiteQueensideRook = true
        } else if (start[0] === this.getRowForColor(WHITE) && start[1] === 7) {
          // White Kingside rook
          this.pieceMovedStatus.whiteKingsideRook = true
        }
      } else {
        if (start[0] === this.getRowForColor(BLACK) && start[1] === 0) {
          // Black Queenside rook
          this.pieceMovedStatus.blackQueensideRook = true
        } else if (start[0] === this.getRowForColor(BLACK) && start[1] === 7) {
          // Black Kingside rook
          this.pieceMovedStatus.blackKingsideRook = true
        }
      }
    }

    // Handle en-passant
    if (piece.toLowerCase() === 'p' && Math.abs(start[0] - end[0]) === 2) {
      // Save potential en-passant target
      this.enPassantTarget = [(start[0] + end[0]) / 2, end[1]]
    } else {
      this.enPassantTarget = null // Clear en-passant target if not relevant
    }

    // Check for pawn promotion
    if (this.promotePawn(end)) {
      this.showPawnPromotionPrompt(end) // Handle promotion in a loop
    }

    // Check for 3-fold repetition
    // Check for repetitionCount being 2 and track it
    if (repetitionCount === 2) {
      this.repetitionCountTwoTracker++ // Increment the counter
    }
    // Check for repetitionCount === 2 get's 4th time
    if (this.repetitionCountTwoTracker === 4) {
      this.drawByRepetition = true // Mark draw by repetition
      this.repetitionCountTwoTracker = 0 // Reset the tracker if needed
    }

    // Switch turn
    this.switchTurn()
  }

  getBoardState() {
    return this.board.map((row) => row.join(',')).join('|') // Create a unique state string for the board
  }

  showPawnPromotionPrompt(position) {
    while (true) {
      try {
        const selectedPiece = prompt(
          `Choose piece to promote to ${
            this.currentPlayerTurn === WHITE ? 'Q, R, B, N' : 'q, r, b, n'
          } `,
        )
        // Attempt to handle promotion with the selected piece
        this.setPiece(
          position[0],
          position[1],
          this.handlePawnPromotion(selectedPiece),
        )
        break // Exit the loop if successful
      } catch (error) {
        alert(error) // Show error if the selected piece is invalid
      }
    }
  }

  handlePawnPromotion(selectedPiece) {
    const validPiecesWhite = ['Q', 'R', 'B', 'N']
    const validPiecesBlack = ['q', 'r', 'b', 'n']
    if (
      (validPiecesWhite.includes(selectedPiece) &&
        this.currentPlayerTurn === WHITE) ||
      (validPiecesBlack.includes(selectedPiece) &&
        this.currentPlayerTurn === BLACK)
    ) {
      return selectedPiece // Return selected piece
    } else {
      throw new Error(
        `Invalid promotion piece! Choose from ${
          this.currentPlayerTurn === WHITE ? 'Q, R, B, N' : 'q, r, b, n'
        }`,
      )
    }
  }

  isCheckmate() {
    const kingPosition = this.findPiecePosition('K', this.currentPlayerTurn)

    // If the king isn't in check, it can't be checkmate
    if (!this.isSquareAttacked(kingPosition)) {
      return false
    }

    // Check if king can move to a safe square
    const [kingX, kingY] = kingPosition
    for (let x = kingX - 1; x <= kingX + 1; x++) {
      for (let y = kingY - 1; y <= kingY + 1; y++) {
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
          if (this.isValidKingMove(kingPosition, [x, y])) {
            const targetPiece = this.getPiece(x, y)
            if (
              targetPiece === null || // Target square is empty
              (targetPiece !== null &&
                this.getPieceColor(targetPiece) !== this.currentPlayerTurn)
            ) {
              // Check if the king moves to this square does not lead to check
              const originalPiece = this.getPiece(kingX, kingY) // Store original piece
              this.removePiece(kingX, kingY) // Move king temporarily
              this.setPiece(x, y, 'K') // Place king on new square

              const isStillSafe = !this.isSquareAttacked([x, y])

              // Move the king back to original position
              this.setPiece(x, y, targetPiece) // Restore target square piece
              this.setPiece(kingX, kingY, originalPiece) // Restore king's original position

              if (isStillSafe) {
                return false // The king has a safe escape move
              }
            }
          }
        }
      }
    }

    // Check if any piece can block the check
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (
          piece !== null &&
          this.getPieceColor(piece) === this.currentPlayerTurn
        ) {
          const validMoves = this.getValidMoves([x, y])

          for (const move of validMoves) {
            // Temporarily make this move
            const originalTargetPiece = this.getPiece(move[0], move[1]) // Store the target piece
            this.setPiece(move[0], move[1], piece) // Move the piece to the new location
            this.removePiece(x, y) // Remove piece from original location

            if (!this.isSquareAttacked(kingPosition)) {
              // Restore the board
              this.setPiece(x, y, piece) // Move the piece back
              this.setPiece(move[0], move[1], originalTargetPiece) // Restore target piece

              return false // There is a valid move that can block the check
            }

            // Restore the board
            this.setPiece(x, y, piece) // Move the piece back
            this.setPiece(move[0], move[1], originalTargetPiece) // Restore target piece
          }
        }
      }
    }

    // If no valid moves can protect the king and the king can't move, it's checkmate
    return true
  }

  isStalemate() {
    // Check if the current player's king is in check
    const kingPosition = this.findPiecePosition('K', this.currentPlayerTurn)
    if (this.isSquareAttacked(kingPosition)) {
      return false // Not stalemate, the king is in check
    }

    // Now check if the player has any legal moves
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (piece && this.getPieceColor(piece) === this.currentPlayerTurn) {
          const validMoves = this.getValidMoves([x, y])
          if (validMoves.length > 0) {
            return false // Found a valid move, so it's not stalemate
          }
        }
      }
    }

    return true // No valid moves, thus stalemate
  }

  getValidMoves(position) {
    const validMoves = []
    const piece = this.getPiece(position[0], position[1])
    if (!piece) {
      throw new Error('No piece at given position!')
    }

    for (let targetX = 0; targetX < 8; targetX++) {
      for (let targetY = 0; targetY < 8; targetY++) {
        if (this.isValidMove(position, [targetX, targetY])) {
          validMoves.push([targetX, targetY])
        }
      }
    }

    return validMoves // Return an array of valid move positions
  }

  isDrawByInsufficientMaterial() {
    // king versus king.
    // king and bishop versus king.
    // king and knight versus king.
    // king and bishop versus king and bishop with the bishops on the same color.

    let whitePieces = 0
    let blackPieces = 0
    let whiteBishops = 0
    let blackBishops = 0

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const piece = this.getPiece(x, y)
        if (!piece) continue // Skip empty squares

        const isWhite = piece === piece.toUpperCase()
        if (isWhite) {
          whitePieces++
          if (piece === 'B') {
            whiteBishops++
          }
        } else {
          blackPieces++
          if (piece === 'b') {
            blackBishops++
          }
        }
      }
    }

    // Check basic king vs king scenario
    if (whitePieces === 1 && blackPieces === 1) {
      return true // King vs King
    }

    // Check king vs king + bishop or knight
    if (
      whitePieces === 1 &&
      (blackPieces === 2 || (blackPieces === 3 && blackBishops === 0))
    ) {
      return true // King vs King + Bishop
    }

    if (
      blackPieces === 1 &&
      (whitePieces === 2 || (whitePieces === 3 && whiteBishops === 0))
    ) {
      return true // King + Bishop vs King
    }

    // Check for the same color bishops
    if (whiteBishops > 0 && blackBishops > 0) {
      if (whiteBishops === 1 && blackBishops === 1) {
        // Assume the bishops are the same color if this piece of information
        // is not tracked, it requires an additional check of their positions.
        const whiteBishopPosition = this.findPiecePosition('B', WHITE)
        const blackBishopPosition = this.findPiecePosition('b', BLACK)
        if (
          (whiteBishopPosition[0] + whiteBishopPosition[1]) % 2 ===
          (blackBishopPosition[0] + blackBishopPosition[1]) % 2
        ) {
          return true // Both bishops on the same color
        }
      }
    }

    return false // There is sufficient material to continue playing
  }

  // Simple representation of the board
  displayBoard() {
    console.log(
      this.board
        .map((row) => row.map((piece) => piece || '.').join(' '))
        .join('\n'),
    )
    console.log(
      `Current turn: ${this.currentPlayerTurn === WHITE ? 'White' : 'Black'}`,
    )
  }
}

// Example of initial FEN notation for a standard chess game
// rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 - standard position
// 2Q2bnr/4pkpq/5p1r/7p/7P/4P3/PPPP1PP1/RNB1KBNR b KQ - 0 9 - stalemate position
// 2k4r/1pp3pp/p1pr1pb1/3Pp3/Nq4P1/1P1PKN1P/2P1QP2/3R3R b - - 0 1 - checkmate position
// 5Bnk/8/6K1/8/8/8/8/8 w - - 0 1 - insufficient material position
// 2n/1P/4k3/1p3p2/7p/P1P2P1K/4p/3N w - - 0 41 - pawn promotion position
// r3kbnr/pppppppp/8/2q/8/8/PPPP2PP/RNBQK2R w KQkq - 0 1 - castling position

// https://lichess.org/3KkqKLdO#66 3-fold rep testing
// https://lichess.org/games/search?perf=6&mode=1&durationMin=600&durationMax=600&status=34&dateMin=2024-10-28&dateMax=2024-10-29&sort.field=d&sort.order=desc#results

const initialFEN = '6k1/5pp1/2R4p/1PR5/8/6P1/1PPr1r1P/6K1 b - - 0 28'
export const chess = new ChessGame(initialFEN)
