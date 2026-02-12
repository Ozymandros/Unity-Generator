<script setup lang="ts">
defineProps<{ status: string | null; tone?: "ok" | "error" }>();
</script>

<template>
  <div v-if="status" class="status" :class="tone">
    {{ status }}
  </div>
</template>

<style scoped src="./StatusBanner.css"></style>
