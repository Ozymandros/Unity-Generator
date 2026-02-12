import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ImagePanel } from "@/components/ImagePanel";
import * as client from "@/api/client";

vi.mock("../../api/client");

describe("ImagePanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders form fields", () => {
    const wrapper = mount(ImagePanel);
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(wrapper.findAll("select").length).toBeGreaterThan(0);
    expect(wrapper.find("button.primary").text()).toBe("Generate");
  });

  it("calls generateImage API on button click", async () => {
    vi.mocked(client.generateImage).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { image: "base64-image-data" },
    });

    const wrapper = mount(ImagePanel);
    await wrapper.find("textarea").setValue("A fantasy landscape");
    
    // Select provider
    const providerSelect = wrapper.findAll("select")[0];
    await providerSelect.setValue("stability");
    
    // Select Aspect Ratio (index 1)
    const arSelect = wrapper.findAll("select")[1];
    await arSelect.setValue("16:9");
    
    // Select Quality (index 2)
    const qualitySelect = wrapper.findAll("select")[2];
    await qualitySelect.setValue("hd");

    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(client.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({ 
        prompt: "A fantasy landscape",
        provider: "stability",
        options: expect.objectContaining({ 
          aspect_ratio: "16:9",
          quality: "hd"
        })
      })
    );
  });

  it("displays result on success", async () => {
    vi.mocked(client.generateImage).mockResolvedValue({
      success: true,
      date: new Date().toISOString(),
      error: null,
      data: { image: "generated-image-base64" },
    });

    const wrapper = mount(ImagePanel);
    await wrapper.find("textarea").setValue("Hero portrait");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    const resultTextarea = wrapper.findAll("textarea")[1];
    expect((resultTextarea.element as HTMLTextAreaElement).value).toContain(
      "generated-image-base64"
    );
  });

  it("shows error status on failure", async () => {
    vi.mocked(client.generateImage).mockResolvedValue({
      success: false,
      date: new Date().toISOString(),
      error: "Image generation failed",
      data: null,
    });

    const wrapper = mount(ImagePanel);
    await wrapper.find("textarea").setValue("Test");
    await wrapper.find("button.primary").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Image generation failed");
  });
});
