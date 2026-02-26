import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createPinia } from "pinia";

const Simple = defineComponent({
  template: "<v-btn>Simple</v-btn>"
});

describe("Smoke Test", () => {
  it("mounts a component with stubbed vuetify", () => {
    const pinia = createPinia();
    const wrapper = mount(Simple, {
      global: {
        plugins: [pinia],
        stubs: {
          'v-btn': {
            template: '<button><slot /></button>'
          }
        }
      }
    });
    expect(wrapper.text()).toBe("Simple");
  });
});
