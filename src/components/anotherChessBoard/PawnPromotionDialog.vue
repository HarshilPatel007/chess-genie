<template>
  <div v-if="isVisible" class="dialog-overlay" @mousedown.stop>
    <div class="promotion-dialog" @mousedown.stop>
      <div class="promotion-options">
        <img
          v-for="piece in pieces"
          :key="piece"
          :src="getPieceImage(piece)"
          :alt="piece"
          @click="props.promotePawn(piece)"
          class="img"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  isVisible: Boolean,
  promotePawn: Function,
  playerTurn: String,
})

const pieces = ['q', 'r', 'b', 'n'] // Queen, Rook, Bishop, Knight

const getPieceImage = (piece) => {
  return `/pieces/cardinal/${props.playerTurn}${piece.toUpperCase()}.svg`
}
</script>

<style scoped>
.dialog-overlay {
  width: 400px;
  height: 400px;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
}
.promotion-dialog {
  top: 50%;
  left: 50%;
  background: white;
  position: absolute;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

.promotion-options {
  display: flex;
  width: 100%;
  height: 100%;
}

.promotion-options img {
  width: 80px;
  height: auto;
  max-width: 100px;
  position: relative;
  cursor: pointer;
}
</style>
