<template>
  <StoreGameCard :game="game" :platform="game.platform" @open="(id) => emit('open', id)" />
</template>

<script setup lang="ts">
import StoreGameCard from './StoreGameCard.vue'
import type { Game } from '../types/catalog'

defineProps<{
  game: Game
}>()

const emit = defineEmits<{
  open: [id: string]
}>()
</script>
