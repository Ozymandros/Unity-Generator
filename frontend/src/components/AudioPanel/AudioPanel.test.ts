import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { AudioPanel } from "@/components/AudioPanel";
import * as client from "@/api/client";

vi.mock("../../api/client");

describe("AudioPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form fields", () => {
    const wrapper = mount(AudioPanel);
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.findAll("select").length).toBeGreaterThan(0);
    expect(wrapper.find("button.primary").text()).toBe("Generate");
  });

  it("calls generateAudio API on button click", async () => {
    vi.mocked(client.generateAudio).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { audio_url: "https://example.com/audio.mp3" },
    });

    const wrapper = mount(AudioPanel);
    await wrapper.find("textarea").setValue("A battle cry");
    
    // Select provider
    const providerSelect = wrapper.findAll("select")[0];
    await providerSelect.setValue("elevenlabs");
    
    // Select voice (should be available after provider selection)
    const voiceSelect = wrapper.findAll("select")[1];
    await voiceSelect.setValue("Rachel");

    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateAudio).toHaveBeenCalledWith(
      expect.objectContaining({ 
        prompt: "A battle cry",
        provider: "elevenlabs",
        options: expect.objectContaining({ voice_id: "Rachel" })
      })
    );
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateAudio).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { audio_url: "https://example.com/output.mp3" },
    });

    const wrapper = mount(AudioPanel);
    await wrapper.find("textarea").setValue("Sound effect");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    const resultTextarea = wrapper.findAll("textarea")[1];
    expect((resultTextarea.element as HTMLTextAreaElement).value).toContain(
      "output.mp3"
    );
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateAudio).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Audio generation failed",
      data: null,
    });

    const wrapper = mount(AudioPanel);
    await wrapper.find("textarea").setValue("Test");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Audio generation failed");
  });
});
