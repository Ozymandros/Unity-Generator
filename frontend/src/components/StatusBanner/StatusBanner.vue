<script setup lang="ts">
defineProps<{ status: string | null; tone?: "ok" | "error" }>();
</script>

<template>
  <v-alert
    v-if="status"
    :type="tone === 'error' ? 'error' : 'success'"
    variant="tonal"
    class="mb-6 rounded-lg"
    border="start"
    density="comfortable"
  >
    {{ status }}
  </v-alert>
</template>

<style scoped src="./StatusBanner.css"></style>
