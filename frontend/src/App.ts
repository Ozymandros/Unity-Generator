import { onMounted, ref } from "vue";
import { healthCheck } from "@/api/client";

export function useApp() {
  const tabs = [
    "Settings",
    "Code",
    "Text",
    "Image",
    "Sprites",
    "Audio",
    "Unity Project",
  ] as const;
  
  const active = ref<(typeof tabs)[number]>("Settings");
  const backendStatus = ref<"online" | "offline">("offline");

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
