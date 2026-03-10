
import { describe, it, expect } from 'vitest';
import { createVuetify } from "vuetify";
import { mount } from "@vue/test-utils";
import StatusBanner from "./StatusBanner.vue";

describe("StatusBanner", () => {
  const vuetify = createVuetify();
  it("renders status message when provided", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: "Operation complete", tone: "ok" },
      global: { plugins: [vuetify] },
    });
    expect(wrapper.text()).toContain("Operation complete");
  });


  it("does not render when status is null", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: null },
      global: { plugins: [vuetify] },
    });
    // v-alert should not be rendered
    expect(wrapper.findComponent({ name: 'VAlert' }).exists()).toBe(false);
  });


  it("applies ok class when tone is ok", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: "Success", tone: "ok" },
      global: { plugins: [vuetify] },
    });
    const alert = wrapper.findComponent({ name: 'VAlert' });
    expect(alert.exists()).toBe(true);
    // Vuetify v-alert uses 'v-alert--text-success' class for success
    expect(alert.classes().some(c => c.includes('success'))).toBe(true);
  });

  it("applies error class when tone is error", () => {
    const wrapper = mount(StatusBanner, {
      props: { status: "Failed", tone: "error" },
      global: { plugins: [vuetify] },
    });
    const alert = wrapper.findComponent({ name: 'VAlert' });
    expect(alert.exists()).toBe(true);
    // Vuetify v-alert uses 'v-alert--text-error' class for error
    expect(alert.classes().some(c => c.includes('error'))).toBe(true);
  });
});
