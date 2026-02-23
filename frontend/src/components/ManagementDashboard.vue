<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { 
  listProviders, saveProvider, deleteProvider,
  listModels, addModel, removeModel,
  listApiKeys, saveApiKey, deleteApiKey,
  listSystemPrompts, saveSystemPrompt,
  getApiKey,
  ProviderCapabilities, ModelEntry
} from '@/api/client';

// Tab management
const activeTab = ref(0);
const tabs = ['Providers', 'System Prompts', 'Global Keys'];

// Providers State
const providers = ref<ProviderCapabilities[]>([]);
const selectedProvider = ref<(ProviderCapabilities & { api_key_value?: string }) | null>(null);
const isLoadingProviders = ref(false);

// Models State
const providerModels = ref<ModelEntry[]>([]);
const isLoadingModels = ref(false);
const newModel = reactive({ value: '', label: '', modality: 'llm' });
const modelModalities = ['llm', 'image', 'audio', 'video', 'sprite', 'text', 'code'];

// API Keys State (Global list)
const apiKeys = ref<Record<string, string>>({});
const keyDialog = ref(false);
const newKey = reactive({ name: '', value: '' });

// Prompts State
const prompts = ref<Record<string, string>>({});
const promptModalities = ['code', 'text', 'image', 'audio', 'music', 'video', 'sprite'];
const isLoadingPrompts = ref(false);

// Feedback
const snackbar = reactive({ show: false, text: '', color: 'success' });

// Table Headers
const modelHeaders = [
  { title: 'Label', key: 'label' },
  { title: 'Value', key: 'value' },
  { title: 'Modality', key: 'modality' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
];

const keyHeaders = [
  { title: 'Service', key: 'name' },
  { title: 'Key Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
];

// Methods
const showMessage = (text: string, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const loadData = async () => {
  isLoadingProviders.value = true;
  isLoadingPrompts.value = true;
  try {
    const [pList, kList, prList] = await Promise.all([
      listProviders(),
      listApiKeys(),
      listSystemPrompts()
    ]);
    providers.value = pList;
    apiKeys.value = kList;

    // Ensure all modalities exist in prompts object for reactivity
    const initializedPrompts: Record<string, string> = {};
    promptModalities.forEach(m => {
      initializedPrompts[m] = prList[m] || '';
    });
    prompts.value = initializedPrompts;
  } catch (e) {
    showMessage('Failed to load data', 'error');
  } finally {
    isLoadingProviders.value = false;
    isLoadingPrompts.value = false;
  }
};

const selectProvider = async (p: ProviderCapabilities) => {
  isLoadingModels.value = true;
  try {
    // Fetch associated API key value if it exists
    let apiKeyValue = '';
    if (p.api_key_name) {
      apiKeyValue = await getApiKey(p.api_key_name) || '';
    } else if (p.requires_api_key) {
      apiKeyValue = await getApiKey(p.name) || '';
    }

    selectedProvider.value = { 
      ...JSON.parse(JSON.stringify(p)), 
      api_key_value: apiKeyValue 
    };

    providerModels.value = await listModels(p.name);
  } catch (e) {
    showMessage('Error loading provider details', 'error');
  } finally {
    isLoadingModels.value = false;
  }
};

const handleSaveProvider = async () => {
  if (selectedProvider.value) {
    if (!selectedProvider.value.name) {
        showMessage('Provider name is required', 'warning');
        return;
    }
    try {
      await saveProvider(selectedProvider.value);
      await loadData();
      showMessage('Provider and associated key saved successfully');
    } catch (e) {
      showMessage('Failed to save provider', 'error');
    }
  }
};

const handleDeleteProvider = async (name: string) => {
  if (confirm(`Are you sure you want to delete ${name}?`)) {
    try {
      await deleteProvider(name);
      selectedProvider.value = null;
      await loadData();
      showMessage('Provider deleted');
    } catch (e) {
      showMessage('Failed to delete provider', 'error');
    }
  }
};

const handleAddModel = async () => {
  if (selectedProvider.value && newModel.value && newModel.label) {
    try {
      await addModel(selectedProvider.value.name, newModel.value, newModel.label, newModel.modality);
      providerModels.value = await listModels(selectedProvider.value.name);
      newModel.value = '';
      newModel.label = '';
      newModel.modality = 'llm';
      showMessage('Model added');
    } catch (e) {
      showMessage('Failed to add model', 'error');
    }
  }
};

const handleRemoveModel = async (val: string) => {
  if (selectedProvider.value) {
    try {
      await removeModel(selectedProvider.value.name, val);
      providerModels.value = await listModels(selectedProvider.value.name);
      showMessage('Model removed');
    } catch (e) {
      showMessage('Failed to remove model', 'error');
    }
  }
};

const handleSaveGlobalKey = async () => {
  if (newKey.name && newKey.value) {
    try {
      await saveApiKey(newKey.name, newKey.value);
      apiKeys.value = await listApiKeys();
      newKey.name = '';
      newKey.value = '';
      keyDialog.value = false;
      showMessage('API Key saved');
    } catch (e) {
      showMessage('Failed to save API Key', 'error');
    }
  }
};

const handleDeleteGlobalKey = async (name: string) => {
  if (confirm(`Delete API key for ${name}?`)) {
    try {
      await deleteApiKey(name);
      apiKeys.value = await listApiKeys();
      showMessage('API Key deleted');
    } catch (e) {
      showMessage('Failed to delete API Key', 'error');
    }
  }
};

const handleSavePrompt = async (modality: string) => {
  try {
    await saveSystemPrompt(modality, prompts.value[modality]);
    showMessage(`${modality.toUpperCase()} prompt saved`);
  } catch (e) {
    showMessage('Failed to save prompt', 'error');
  }
};

const initiateAddProvider = () => {
  selectedProvider.value = {
    name: '',
    api_key_name: '',
    api_key_value: '',
    base_url: '',
    openai_compatible: true,
    requires_api_key: true,
    supports_vision: false,
    supports_streaming: true,
    supports_function_calling: false,
    supports_tool_use: false,
    modalities: ['llm'],
    default_models: {},
    extra: {}
  };
  providerModels.value = [];
};

const formattedKeys = computed(() => {
  return Object.entries(apiKeys.value).map(([name, value]) => ({
    name,
    status: value ? `••••••••${value.slice(-4)}` : 'No key set'
  }));
});

onMounted(loadData);
</script>

<template>
  <v-app dark id="management-root">
    <v-navigation-drawer permanent width="300" class="glass-drawer">
      <v-toolbar flat color="transparent" title="Engines & Logic">
        <template v-slot:append>
          <v-btn icon="mdi-plus-circle" color="primary" variant="text" @click="initiateAddProvider" title="Add Provider"></v-btn>
        </template>
      </v-toolbar>

      <v-divider></v-divider>

      <v-list nav v-if="!isLoadingProviders">
        <v-list-subheader>ENABLED PROVIDERS</v-list-subheader>
        <v-list-item
          v-for="p in providers"
          :key="p.name"
          :value="p"
          :active="selectedProvider?.name === p.name"
          @click="selectProvider(p)"
          prepend-icon="mdi-brain"
          rounded="lg"
          class="mb-1"
        >
          <v-list-item-title class="font-weight-medium">{{ p.name }}</v-list-item-title>
          <v-list-item-subtitle v-if="p.openai_compatible">OpenAI Compatible</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-skeleton-loader v-else type="list-item-avatar@5" class="bg-transparent"></v-skeleton-loader>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-6">
        <v-tabs v-model="activeTab" color="primary" class="mb-8" align-tabs="start">
          <v-tab v-for="tab in tabs" :key="tab" :value="tabs.indexOf(tab)" prepend-icon="mdi-view-dashboard-outline">
            {{ tab }}
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- Providers & Models -->
          <v-window-item :value="0">
            <v-row v-if="selectedProvider">
              <v-col cols="12" lg="7">
                <v-card class="glass-card pa-2" elevation="8">
                  <v-card-title class="d-flex align-center text-h5 font-weight-bold">
                    <v-icon start color="primary">mdi-application-cog-outline</v-icon>
                    {{ selectedProvider.name || 'Register New Engine' }}
                  </v-card-title>
                  <v-divider class="my-2"></v-divider>
                  <v-card-text>
                    <v-form @submit.prevent="handleSaveProvider">
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="selectedProvider.name"
                            label="Provider ID"
                            placeholder="e.g. anthropic"
                            variant="outlined"
                            density="comfortable"
                            :disabled="!!providers.find(p => p.name === selectedProvider?.name && selectedProvider?.name !== '')"
                            persistent-hint
                            hint="The unique identifier for this provider"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="selectedProvider.api_key_name"
                            label="Key Store Mapping"
                            placeholder="e.g. anthropic_api_key"
                            variant="outlined"
                            density="comfortable"
                            persistent-hint
                            hint="Key name in internal storage"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="selectedProvider.api_key_value"
                            label="Secret API Key"
                            placeholder="sk-..."
                            variant="outlined"
                            density="comfortable"
                            type="password"
                            prepend-inner-icon="mdi-key"
                            persistent-hint
                            hint="Managed directly for this provider"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="selectedProvider.base_url"
                            label="Endpoint URL"
                            placeholder="https://api.example.com/v1"
                            variant="outlined"
                            density="comfortable"
                            prepend-inner-icon="mdi-web"
                          ></v-text-field>
                        </v-col>
                      </v-row>

                      <v-divider class="my-4"></v-divider>
                      <div class="text-overline mb-2">Capabilities & Protocols</div>

                      <v-row dense>
                        <v-col cols="6" sm="4">
                          <v-checkbox v-model="selectedProvider.openai_compatible" label="OpenAI Proto" color="primary" hide-details density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="6" sm="4">
                          <v-checkbox v-model="selectedProvider.requires_api_key" label="Auth Required" color="primary" hide-details density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="6" sm="4">
                          <v-checkbox v-model="selectedProvider.supports_vision" label="Vision (OCR)" color="primary" hide-details density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="6" sm="4">
                          <v-checkbox v-model="selectedProvider.supports_streaming" label="Streaming" color="primary" hide-details density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="6" sm="4">
                          <v-checkbox v-model="selectedProvider.supports_function_calling" label="Func Calls" color="primary" hide-details density="compact"></v-checkbox>
                        </v-col>
                        <v-col cols="6" sm="4">
                          <v-checkbox v-model="selectedProvider.supports_tool_use" label="Tool Use" color="primary" hide-details density="compact"></v-checkbox>
                        </v-col>
                      </v-row>

                      <v-select
                        v-model="selectedProvider.modalities"
                        label="Supported Modalities"
                        :items="modelModalities"
                        multiple
                        chips
                        variant="outlined"
                        class="mt-6"
                        closable-chips
                      ></v-select>
                    </v-form>
                  </v-card-text>
                  <v-card-actions class="pa-4">
                    <v-btn color="error" variant="tonal" prepend-icon="mdi-trash-can-outline" @click="handleDeleteProvider(selectedProvider.name)">Delete</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="elevated" size="large" prepend-icon="mdi-content-save-check" @click="handleSaveProvider">Commit Configuration</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>

              <v-col cols="12" lg="5">
                <v-card class="glass-card" elevation="8">
                  <v-card-title class="d-flex align-center py-4">
                    <v-icon start color="secondary">mdi-robot-outline</v-icon>
                    Available Models
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-data-table
                    :headers="modelHeaders"
                    :items="providerModels"
                    :loading="isLoadingModels"
                    class="elevation-0 transparent-table"
                    density="comfortable"
                    height="300"
                    fixed-header
                  >
                    <template v-slot:item.modality="{ item }">
                      <v-chip size="x-small" :color="item.modality === 'llm' ? 'blue-darken-2' : 'purple-darken-2'" variant="flat" label>
                        {{ item.modality.toUpperCase() }}
                      </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                      <v-btn icon="mdi-close-circle-outline" size="small" color="red" variant="text" @click="handleRemoveModel(item.value)"></v-btn>
                    </template>
                  </v-data-table>

                  <v-divider></v-divider>
                  <v-card-text class="bg-surface-light">
                    <div class="text-subtitle-2 font-weight-bold mb-3">Quick Register Model</div>
                    <v-row dense>
                      <v-col cols="12">
                        <v-text-field v-model="newModel.label" label="Friendly Label" placeholder="e.g. GPT-4o" variant="outlined" density="compact" hide-details class="mb-2"></v-text-field>
                      </v-col>
                      <v-col cols="7">
                        <v-text-field v-model="newModel.value" label="Engine ID" placeholder="gpt-4o" variant="outlined" density="compact" hide-details></v-text-field>
                      </v-col>
                      <v-col cols="5">
                        <v-select v-model="newModel.modality" :items="modelModalities" label="Type" variant="outlined" density="compact" hide-details></v-select>
                      </v-col>
                    </v-row>
                    <v-btn block color="secondary" variant="flat" @click="handleAddModel" class="mt-4" prepend-icon="mdi-plus">Register Model</v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <div v-else class="d-flex flex-column align-center justify-center py-16 text-grey-darken-2">
              <v-icon size="160" class="mb-4 opacity-20">mdi-molecule</v-icon>
              <div class="text-h5 font-weight-light">Select an engine to configure logic and models</div>
              <v-btn prepend-icon="mdi-plus-box" color="primary" variant="outlined" size="large" class="mt-8" @click="initiateAddProvider">Register New Provider</v-btn>
            </div>
          </v-window-item>

          <!-- System Prompts -->
          <v-window-item :value="1">
            <v-alert v-if="isLoadingPrompts" type="info" variant="tonal" class="mb-4">Synchronizing system personas...</v-alert>
            <v-row v-else>
              <v-col v-for="mod in promptModalities" :key="mod" cols="12" md="6">
                <v-card class="glass-card overflow-hidden">
                  <v-toolbar density="compact" color="transparent" flat>
                    <v-chip class="ml-4" color="secondary" size="small" variant="flat">{{ mod.toUpperCase() }} CORE</v-chip>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-content-save" size="small" color="primary" @click="handleSavePrompt(mod)"></v-btn>
                  </v-toolbar>
                  <v-textarea
                    v-model="prompts[mod]"
                    rows="10"
                    variant="plain"
                    class="px-4 py-2 code-font"
                    no-resize
                    placeholder="Define the behavior for this modality..."
                    bg-color="transparent"
                  ></v-textarea>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- Global Keys -->
          <v-window-item :value="2">
            <v-card class="glass-card">
              <v-data-table
                :headers="keyHeaders"
                :items="formattedKeys"
                class="transparent-table"
              >
                <template v-slot:top>
                  <v-toolbar flat color="transparent">
                    <v-toolbar-title class="font-weight-bold">Master Key Chain</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="elevated" prepend-icon="mdi-key-plus" @click="keyDialog = true">Add Manual Key</v-btn>
                  </v-toolbar>
                </template>
                <template v-slot:item.status="{ item }">
                  <code class="px-2 py-1 rounded bg-black text-primary">{{ item.status }}</code>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-delete-sweep-outline" size="small" color="error" variant="text" @click="handleDeleteGlobalKey(item.name)"></v-btn>
                </template>
              </v-data-table>
            </v-card>

            <v-dialog v-model="keyDialog" max-width="500">
              <v-card class="glass-card pa-4">
                <v-card-title class="text-h5">Store New Secret</v-card-title>
                <v-card-text>
                  <v-text-field v-model="newKey.name" label="Service Identifier" placeholder="e.g. replicate" variant="outlined" class="mb-2"></v-text-field>
                  <v-text-field v-model="newKey.value" label="Secret Value" type="password" variant="outlined" prepend-inner-icon="mdi-lock"></v-text-field>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="keyDialog = false">Cancel</v-btn>
                  <v-btn color="primary" variant="elevated" @click="handleSaveGlobalKey">Store Key</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-window-item>
        </v-window>
      </v-container>
    </v-main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" elevation="24">
      <div class="d-flex align-center">
        <v-icon start>{{ snackbar.color === 'error' ? 'mdi-alert' : 'mdi-check-circle' }}</v-icon>
        {{ snackbar.text }}
      </div>
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style scoped>
.glass-drawer {
  background: rgba(15, 23, 42, 0.98) !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.glass-card {
  background: rgba(30, 41, 59, 0.8) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 20px !important;
  transition: transform 0.2s, box-shadow 0.2s;
}

.transparent-table :deep(table) {
  background: transparent !important;
}

.transparent-table :deep(thead th) {
  font-weight: 800 !important;
  color: #cbd5e1 !important; /* Brighter gray */
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.transparent-table :deep(tr:hover) {
  background: rgba(255, 255, 255, 0.03) !important;
}

.code-font :deep(textarea) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace !important;
  font-size: 0.85rem !important;
  line-height: 1.7 !important;
  color: #e2e8f0 !important;
}

.v-list-subheader {
  font-size: 0.7rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.1em !important;
  color: #cbd5e1 !important; /* Brighter gray */
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--v-primary-base);
}

.h-100 {
  height: 100%;
}
</style>
