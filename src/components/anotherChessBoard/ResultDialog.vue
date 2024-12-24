<template>
  <div v-if="isVisible" class="dialog-overlay" @mousedown.stop>
    <div class="result-dialog" @mousedown.stop>
      <h1>Game Result</h1>
      <p>{{ props.result }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  isVisible: Boolean,
  result: String,
})
</script>

<style scoped>
.dialog-overlay {
  width: 400px;
  height: 400px;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
}
.result-dialog {
  top: 50%;
  left: 50%;
  background: white;
  position: absolute;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}
</style>
