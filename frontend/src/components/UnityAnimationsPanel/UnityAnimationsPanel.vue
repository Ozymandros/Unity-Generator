<script setup lang="ts">
import UnityMcpModalityPanel from "@/components/UnityMcpModalityPanel/UnityMcpModalityPanel.vue";
import { ANIMATION_CONFIG } from "@/constants/unityMcpModalityConfigs";
</script>

<template>
  <UnityMcpModalityPanel :config="ANIMATION_CONFIG" generate-icon="mdi-animation-play" />
</template>
