<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  listProviders, saveProvider, deleteProvider,
  listModels, addModel, removeModel,
  listApiKeys, saveApiKey, deleteApiKey,
  listSystemPrompts, saveSystemPrompt,
  ProviderCapabilities, ModelEntry
} from '@/api/client';

const activeSubTab = ref<'providers' | 'keys' | 'prompts'>('providers');

// Providers & Models
const providers = ref<ProviderCapabilities[]>([]);
const selectedProvider = ref<ProviderCapabilities | null>(null);
const providerModels = ref<ModelEntry[]>([]);
const newModel = ref({ value: '', label: '' });

// API Keys
const apiKeys = ref<Record<string, string>>({});
const newKey = ref({ name: '', value: '' });

// Prompts
const prompts = ref<Record<string, string>>({});
const modalities = ['code', 'text', 'image', 'audio', 'music', 'video', 'sprite'];

const loadData = async () => {
    providers.value = await listProviders();
    apiKeys.value = await listApiKeys();
    prompts.value = await listSystemPrompts();
};

const selectProvider = async (p: ProviderCapabilities) => {
    selectedProvider.value = p;
    providerModels.value = await listModels(p.name);
};

const handleSaveProvider = async () => {
    if (selectedProvider.value) {
        await saveProvider(selectedProvider.value);
        await loadData();
    }
};

const handleDeleteProvider = async (name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        await deleteProvider(name);
        selectedProvider.value = null;
        await loadData();
    }
};

const handleAddModel = async () => {
    if (selectedProvider.value && newModel.value.value && newModel.value.label) {
        await addModel(selectedProvider.value.name, newModel.value.value, newModel.value.label);
        providerModels.value = await listModels(selectedProvider.value.name);
        newModel.value = { value: '', label: '' };
    }
};

const handleRemoveModel = async (val: string) => {
    if (selectedProvider.value) {
        await removeModel(selectedProvider.value.name, val);
        providerModels.value = await listModels(selectedProvider.value.name);
    }
};

const handleSaveKey = async () => {
    if (newKey.value.name && newKey.value.value) {
        await saveApiKey(newKey.value.name, newKey.value.value);
        apiKeys.value = await listApiKeys();
        newKey.value = { name: '', value: '' };
    }
};

const handleDeleteKey = async (name: string) => {
    await deleteApiKey(name);
    apiKeys.value = await listApiKeys();
};

const handleSavePrompt = async (modality: string) => {
    await saveSystemPrompt(modality, prompts.value[modality]);
    // Show toast or feedback
};

onMounted(loadData);
</script>

<template>
  <div class="management-dashboard">
    <header>
      <h2>Management Dashboard</h2>
      <div class="sub-tabs">
        <button 
          v-for="tab in ['providers', 'keys', 'prompts']" 
          :key="tab"
          :class="{ active: activeSubTab === tab }"
          @click="activeSubTab = tab as any"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>
    </header>

    <div class="content">
      <!-- Providers & Models Tab -->
      <section v-if="activeSubTab === 'providers'" class="tab-pane providers-pane">
        <div class="sidebar">
          <h3>Providers</h3>
          <ul>
            <li 
              v-for="p in providers" 
              :key="p.name"
              :class="{ selected: selectedProvider?.name === p.name }"
              @click="selectProvider(p)"
            >
              {{ p.name }}
            </li>
          </ul>
        </div>
        
        <div v-if="selectedProvider" class="details">
          <div class="card">
            <h3>{{ selectedProvider.name }} Configuration</h3>
            <div class="form-grid">
              <label>
                Base URL
                <input v-model="selectedProvider.base_url" placeholder="https://api..." />
              </label>
              <label>
                API Key Name
                <input v-model="selectedProvider.api_key_name" placeholder="e.g. openai_api_key" />
              </label>
              <div class="checkboxes">
                <label><input type="checkbox" v-model="selectedProvider.openai_compatible" /> OpenAI Compatible</label>
                <label><input type="checkbox" v-model="selectedProvider.requires_api_key" /> Requires Key</label>
                <label><input type="checkbox" v-model="selectedProvider.supports_vision" /> Vision</label>
                <label><input type="checkbox" v-model="selectedProvider.supports_streaming" /> Streaming</label>
              </div>
            </div>
            <div class="actions">
              <button class="primary" @click="handleSaveProvider">Save Provider</button>
              <button class="secondary danger" @click="handleDeleteProvider(selectedProvider.name)">Delete Provider</button>
            </div>
          </div>

          <div class="card models-card">
            <h3>Models</h3>
            <div class="model-list">
              <div v-for="m in providerModels" :key="m.value" class="model-item">
                <span>{{ m.label }} ({{ m.value }})</span>
                <button class="icon-btn delete" @click="handleRemoveModel(m.value)">×</button>
              </div>
            </div>
            <div class="add-model">
              <input v-model="newModel.label" placeholder="Model Label (e.g. GPT-4o)" />
              <input v-model="newModel.value" placeholder="Model ID (e.g. gpt-4o)" />
              <button @click="handleAddModel">Add Model</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          Select a provider to manage settings and models
        </div>
      </section>

      <!-- API Keys Tab -->
      <section v-if="activeSubTab === 'keys'" class="tab-pane keys-pane">
        <div class="card">
          <h3>Active API Keys</h3>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Key Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(val, name) in apiKeys" :key="name">
                <td>{{ name }}</td>
                <td><code class="key-preview">••••••••{{ val.slice(-4) }}</code></td>
                <td>
                  <button class="icon-btn delete" @click="handleDeleteKey(name)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card add-key-card">
          <h3>Add / Update Key</h3>
          <div class="form-inline">
            <input v-model="newKey.name" placeholder="Service Name (e.g. anthropic)" />
            <input v-model="newKey.value" type="password" placeholder="API Key" />
            <button class="primary" @click="handleSaveKey">Save Key</button>
          </div>
        </div>
      </section>

      <!-- System Prompts Tab -->
      <section v-if="activeSubTab === 'prompts'" class="tab-pane prompts-pane">
        <div v-for="mod in modalities" :key="mod" class="card prompt-card">
          <div class="card-header">
            <h3>{{ mod.toUpperCase() }} System Prompt</h3>
            <button @click="handleSavePrompt(mod)">Save</button>
          </div>
          <textarea v-model="prompts[mod]" rows="4"></textarea>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.management-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  overflow-y: auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.sub-tabs {
  display: flex;
  gap: 0.5rem;
}

.sub-tabs button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-tabs button.active {
  background: var(--primary-color, #646cff);
  color: white;
  border-color: transparent;
}

.tab-pane {
  display: flex;
  gap: 2rem;
  animation: fadeIn 0.3s ease-out;
}

.sidebar {
  width: 200px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 1rem;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.25rem;
  transition: background 0.2s;
}

.sidebar li:hover {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar li.selected {
  background: rgba(100, 108, 255, 0.2);
  color: #646cff;
  font-weight: 600;
}

.details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #ccc;
}

input, textarea {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-family: inherit;
}

.checkboxes {
  grid-column: span 2;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-top: 0.5rem;
}

.checkboxes label {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

button.primary {
  background: var(--primary-color, #646cff);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

button.primary:hover {
  opacity: 0.9;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.add-model {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
}

.icon-btn.delete {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

th, td {
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.key-preview {
  font-family: monospace;
  background: rgba(0,0,0,0.3);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.form-inline {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
}

.prompt-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompts-pane {
  flex-direction: column;
  flex: 1;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
