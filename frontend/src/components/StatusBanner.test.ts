import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import StatusBanner from "./StatusBanner.vue";

describe("StatusBanner", () => {
  it("renders status message when provided", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: "Operation complete", tone: "ok" },
    });
    expect(wrapper.text()).toContain("Operation complete");
  });

  it("does not render when status is null", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: null },
    });
    expect(wrapper.find(".status").exists()).toBe(false);
  });

  it("applies ok class when tone is ok", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: "Success", tone: "ok" },
    });
    expect(wrapper.find(".status").classes()).toContain("ok");
  });

  it("applies error class when tone is error", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: "Failed", tone: "error" },
    });
    expect(wrapper.find(".status").classes()).toContain("error");
  });
});
