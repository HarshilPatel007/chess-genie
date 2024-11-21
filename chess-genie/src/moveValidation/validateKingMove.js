import { setEnPassantInfo } from './validatePawnMove'

export const validateKingMove = (fromRow, fromCol, toRow, toCol, board) => {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)

  // King can move one square in any direction
  if (rowDiff > 1 || colDiff > 1) return false

  // Check for capturing (can't capture own pieces)
  if (board[toRow][toCol] && board[toRow][toCol][0] === board[fromRow][fromCol][0]) {
    return false
  }
  setEnPassantInfo(null)
  return true
}