# System Prompts Configuration

Unity Generator allows you to configure system prompts to tailor the AI's behavior, style, and output format across all generation features: **Code, Text, Image, Audio, and Sprites**.

## Global Default System Prompts

To set global default system prompts:

1. Navigate to the **Settings** panel in the application.
2. Scroll down to the **Default System Prompts (Global)** section.
3. Enter your desired prompts for any or all generation types (Code, Text, Image, Audio, Sprites).
    * *Example (Code):* "You are a senior Unity developer who prefers composition over inheritance."
    * *Example (Image):* "Professional concept art, vibrant colors, 4k resolution."
4. Click **Save**.

These prompts will be used for their respective generation tasks unless a local override is provided.

## Local System Prompt Overrides

To override a system prompt for a specific request:

1. Navigate to any generation panel (e.g., **Images**, **SFX**, **Sprites**).
2. Expand the **Advanced Options** section (or similar toggle).
3. Enter your specific instructions in the **System Prompt Override** field.
4. The placeholder text in this field shows your current global default for reference.
5. Click **Generate**.

The local override takes precedence over the global default for that specific generation run.

## Fallback Logic

The system determines the effective system prompt in the following order:

1. **Local Override**: If provided in the request (`system_prompt` field).
2. **Global Preference**: If set in the application settings (stored in local DB).
3. **Hardcoded Default**: If neither of the above is set, the application uses built-in defaults for each asset type.
