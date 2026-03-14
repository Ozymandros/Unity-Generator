import { onMounted, ref } from "vue";
import { healthCheck } from "@/api/client";

// Shared module-level state for useApp
const tabs = [
  "Settings",
  "Scenes",
  "Code",
  "Text",
  "Image",
  "Sprites",
  "Audio",
  "Unity UI",
  "Unity Project",
  "Management",
] as const;

const active = ref<(typeof tabs)[number]>("Settings");
const backendStatus = ref<"online" | "offline">("offline");

export function useApp() {
  const setActive = (tab: (typeof tabs)[number]) => {
    active.value = tab;
    return active.value;
  };

  onMounted(async () => {
    try {
      const response = await healthCheck();
      backendStatus.value = response.status === "ok" ? "online" : "offline";
    } catch {
      backendStatus.value = "offline";
    }
  });

  return {
    tabs,
    active,
    backendStatus,
    setActive
  };
}
