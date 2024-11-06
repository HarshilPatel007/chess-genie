// playstockfish.js

export class PlayStockfish {
  constructor(chessGame) {
    this.chessGame = chessGame
    this.stockfish = new Worker('./stockfish/stockfish-16.1-lite-single.js')

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

    this.stockfish.postMessage('setoption name UCI_Elo value 800') // Set Stockfish strength
  }

  extractBestMove(message) {
    const parts = message.split(' ') // get the best move from the message from stockfish
    return parts[1] // returns the "e2e4" part
  }

  handleStockfishMove(move) {
    const coordinates = this.chessGame.getCoordinatesFromMove(move)

    const start = coordinates['start']
    const end = coordinates['end']

    try {
      this.chessGame.makeMove(start, end)
    } catch (error) {
      console.error(error) // Log the error to the console if move is invalid
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
