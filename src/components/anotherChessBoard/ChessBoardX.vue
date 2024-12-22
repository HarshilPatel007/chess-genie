<template>
  <div class="chessboard" @mousedown="startDrawing" @mouseup="stopDrawing" @mousemove="drawArrow">
    <svg
      ref="svg"
      width="400"
      height="400"
      style="position: absolute; top: 0; left: 0; pointer-events: none"
    >
      <g v-for="(arrow, index) in arrows" :key="index">
        <marker
          :id="`arrowhead-${index}`"
          refX="1.25"
          refY="1.25"
          markerWidth="2"
          markerHeight="2.5"
          orient="auto"
        >
          <polygon points="0.3 0, 2 1.25, 0.3 2.5" :fill="arrow.color" />
        </marker>
        <line
          :x1="arrow.start.x"
          :y1="arrow.start.y"
          :x2="arrow.end.x"
          :y2="arrow.end.y"
          :marker-end="`url(#arrowhead-${index})`"
          stroke-width="10"
          :stroke="arrow.color"
          fill="none"
          opacity="0.7"
        />
      </g>

      <!-- Only show this line while drawing -->
      <line
        v-if="isDrawing"
        :x1="startX"
        :y1="startY"
        :x2="endX"
        :y2="endY"
        stroke-width="10"
        stroke="red"
        fill="none"
        opacity="0.4"
        marker-end="url(#arrowhead-temp)"
      />

      <marker
        id="arrowhead-temp"
        refX="1.25"
        refY="1.25"
        markerWidth="2"
        markerHeight="2.5"
        orient="auto"
      >
        <polygon points="0.3 0, 2 1.25, 0.3 2.5" fill="red" />
      </marker>
    </svg>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const isDrawing = ref(false)
    const startX = ref(null)
    const startY = ref(null)
    const endX = ref(null)
    const endY = ref(null)
    const arrows = ref([])

    const startDrawing = (event) => {
      isDrawing.value = true
      const rect = event.target.getBoundingClientRect()
      startX.value = event.clientX - rect.left
      startY.value = event.clientY - rect.top

      endX.value = startX.value
      endY.value = startY.value
    }

    const stopDrawing = () => {
      if (isDrawing.value && endX.value !== null && endY.value !== null) {
        arrows.value.push({
          start: { x: startX.value, y: startY.value },
          end: { x: endX.value, y: endY.value },
          color: 'red',
        })
      }
      isDrawing.value = false
      startX.value = null
      startY.value = null
      endX.value = null
      endY.value = null
    }

    const drawArrow = (event) => {
      if (!isDrawing.value) return
      const rect = event.currentTarget.getBoundingClientRect()
      endX.value = event.clientX - rect.left
      endY.value = event.clientY - rect.top
    }

    return {
      startDrawing,
      stopDrawing,
      drawArrow,
      startX,
      startY,
      endX,
      endY,
      isDrawing,
      arrows,
    }
  },
}
</script>

<style scoped>
.chessboard {
  position: relative;
  width: 400px;
  height: 400px;
  background-image: url('../../public/chessboard/blue2.jpg');
  background-size: cover;
}

svg {
  border: 1px solid #000;
}
</style>
