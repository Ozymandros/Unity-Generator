<script setup lang="ts">
import UnityMcpModalityPanel from "@/components/UnityMcpModalityPanel/UnityMcpModalityPanel.vue";
import { MATERIALS_CONFIG } from "@/constants/unityMcpModalityConfigs";
</script>

<template>
  <UnityMcpModalityPanel :config="MATERIALS_CONFIG" generate-icon="mdi-palette" />
</template>
