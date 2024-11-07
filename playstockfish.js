// playstockfish.js

export class PlayStockfish {
  constructor(chessGame, chessUI) {
    this.chessGame = chessGame
    this.chessUI = chessUI
    this.stockfish = new Worker('./stockfish/stockfish-16.1-lite-single.js')
    this.stockfishLevel = 0

    this.initializeStockfish()
  }

  initializeStockfish() {
    this.stockfish.onmessage = (event) => {
      const message = event.data
      if (message.includes('bestmove')) {
        const bestMove = this.extractBestMove(message)
        this.handleStockfishMove(bestMove)
      }
    }

    this.stockfish.postMessage(
      `setoption name Skill Level value ${this.stockfishLevel}`,
    ) // Set Stockfish strength skill level (1-20)
  }

  extractBestMove(message) {
    const parts = message.split(' ') // get the best move from the message from stockfish
    return parts[1] // returns the "e2e4" part
  }

  handleStockfishMove(move) {
    const coordinates = this.chessGame.getCoordinatesFromMove(move)

    const start = coordinates['start']
    const end = coordinates['end']

    // Check for castling move
    const castlingType = this.chessGame.isCastlingMove(start, end)
    if (castlingType) {
      try {
        this.chessGame.castle(start, end)
        this.chessUI.renderBoard()
        this.chessGame.switchTurn()
      } catch (error) {
        console.error(error) // Log error for invalid castling
      }
    } else {
      try {
        this.chessGame.makeMove(start, end)
        this.chessUI.renderBoard() // Refresh the board after Stockfish's move
      } catch (error) {
        console.error(error) // Log error for an invalid move
      }
    }
  }

  requestStockfishMove() {
    const fen = this.chessGame.getFEN() // Get FEN from current game state
    this.stockfish.postMessage(`position fen ${fen}`)
    this.stockfish.postMessage('go movetime 1000') // Specify the move time for Stockfish
  }

  onPlayerMove(gameOver) {
    if (!gameOver) {
      this.requestStockfishMove() // Ask Stockfish for a move
    }
  }
}
