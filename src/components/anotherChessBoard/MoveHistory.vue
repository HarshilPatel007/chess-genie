<template>
  <div class="w-[400px] h-[200px] border border-gray-300 rounded-lg overflow-auto p-2">
    <div class="flex flex-wrap gap-2">
      <div v-for="(moveGroup, index) in formattedMoves" :key="index" class="flex items-center">
        <span class="font-bold">{{ index + 1 }}. </span>
        <span class="flex items-center">
          <span v-for="(move, moveIndex) in moveGroup" :key="moveIndex">
            <button
              class="text-blue-500 underline hover:text-blue-700 focus:outline-none text-sm break-words mx-1"
              @click="navigateToMove(moveIndex + index * 2)"
            >
              {{ move.san }}
            </button>
            <span v-if="move.variations.length">
              (
              <span v-for="(variation, varIndex) in move.variations" :key="varIndex">
                <button
                  class="text-blue-500 underline hover:text-blue-700 focus:outline-none text-sm break-words mx-1"
                  @click="navigateToMove(index * 2 + moveIndex, varIndex)"
                >
                  {{ variation.san }}
                </button>
                <span v-if="varIndex < move.variations.length - 1">, </span>
              </span>
              )
            </span>
            <span v-if="moveIndex < moveGroup.length - 1"> </span>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  moves: {
    type: Array,
    required: true,
  },
  onNavigate: {
    type: Function,
    required: true,
  },
})

// Compute formatted moves grouped by turn
const formattedMoves = computed(() => {
  const result = []
  for (let i = 0; i < props.moves.length; i += 2) {
    result.push(props.moves.slice(i, i + 2))
  }
  return result
})

const navigateToMove = (index, variationIndex = null) => {
  props.onNavigate(index, variationIndex)
}
</script>
