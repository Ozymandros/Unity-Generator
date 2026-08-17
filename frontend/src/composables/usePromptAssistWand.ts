import { ref } from "vue";
import { promptAssist } from "@/api/client";
import { useIntelligenceStore } from "@/store/intelligenceStore";

/**
 * Prompt assist wand actions (enhance / sample) without MCP tools.
 */
export function usePromptAssistWand(onUpdate: (text: string) => void) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const store = useIntelligenceStore();

  async function run(mode: "enhance" | "sample", prompt: string): Promise<void> {
    if (!prompt.trim()) {
      error.value = "Prompt cannot be empty";
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      await store.load();
      const preferred = store.getPreferredEngine("llm");
      const response = await promptAssist({
        prompt,
        mode,
        provider: preferred.provider || undefined,
        options: { model: preferred.model || undefined },
      });
      if (response.success && response.data?.content) {
        onUpdate(String(response.data.content));
      } else {
        error.value = response.error || "Prompt assist failed";
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, enhance: (prompt: string) => run("enhance", prompt), sample: (prompt: string) => run("sample", prompt) };
}
