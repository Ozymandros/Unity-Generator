<script setup lang="ts">
import UnityMcpModalityPanel from "@/components/UnityMcpModalityPanel/UnityMcpModalityPanel.vue";
import { CAMERA_CONFIG } from "@/constants/unityMcpModalityConfigs";
</script>

<template>
  <UnityMcpModalityPanel :config="CAMERA_CONFIG" generate-icon="mdi-camera" />
</template>
