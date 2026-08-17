<script setup lang="ts">
import UnityMcpModalityPanel from "@/components/UnityMcpModalityPanel/UnityMcpModalityPanel.vue";
import { LIGHTING_CONFIG } from "@/constants/unityMcpModalityConfigs";
</script>

<template>
  <UnityMcpModalityPanel :config="LIGHTING_CONFIG" generate-icon="mdi-lightbulb-on" />
</template>
