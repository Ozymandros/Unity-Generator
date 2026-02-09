<script lang="ts">
export default {
  name: "StatusBanner",
};
</script>

<script setup lang="ts">
defineProps<{ status: string | null; tone?: "ok" | "error" }>();
</script>

<template>
  <div v-if="status" class="status" :class="tone">
    {{ status }}
  </div>
</template>

<style scoped>
.status {
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}
.ok {
  background: #e7f8ef;
  color: #0f5132;
}
.error {
  background: #fdecea;
  color: #842029;
}
</style>
