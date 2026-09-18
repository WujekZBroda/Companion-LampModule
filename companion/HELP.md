## Lamp Module (ArtNet / DMX)

This module transmits ArtNet packets to the IP and universe you configure. Configure named lamps and channels in the instance settings, then control them from button actions.

Based on the Bitfocus [generic-artnet](https://github.com/bitfocus/companion-module-generic-artnet) Companion module (MIT).

If you need multiple universes, add multiple instances of this module.

### Configuration

- **Receiver IP** / **Universe** / update timers — ArtNet output
- **Number of Lamps** — how many lamps to configure (shown/hidden dynamically)
- Per lamp: name, channel count, and for each channel: name, DMX address, default value

Lamp channel **default** values are applied automatically when the instance starts. Saving config later does not reset live DMX values. Use the **Apply lamp defaults** action to push defaults on demand.

### Variables (Companion v5)

Numeric fields on actions/feedbacks are text inputs with **custom variables** and **local variables** enabled (`useVariables: { local: true }`). You can also use Companion’s expression mode on those fields. There are no separate “by custom variable” actions.

#### Live DMX values (for button text / expressions)

For each channel configured on a lamp, the module publishes:

- `lamp_L_channel_C` — current DMX value (0–255) for that lamp channel  
  Example label in the variable list: `DMX value: Front / Dimmer`
- `dmx_N` — same value keyed by DMX address (e.g. `dmx_12` for address 12)

On a button, use the connection’s variables, e.g. `$(My ArtNet:lamp_0_channel_0)` (exact prefix = your connection label).

Convert to % / Kelvin / RGB yourself in Companion (button text expressions or local variables). The module only exposes raw DMX.

### Actions

- **Set Value**: Set a DMX channel to a value (optional fade); variables supported
- **Set Complex Value**: Set multiple channel/value pairs at once; variables supported
- **Offset Value**: Change a channel by a relative amount; variables supported
- **Set Value by lamp channel**: Pick lamp → channel from config, set value (optional fade)
- **Offset Value by Channel Name**: Pick a named channel from the list, offset value
- **Save lamp preset**: Store current values of all channels of a lamp into a preset slot (1…N). Stored in connection config as one JSON field per lamp (`lamp_X_presets`) — included in Companion export/import
- **Recall lamp preset**: Apply a saved lamp preset (optional fade)
- **Lamp off**: Set all channels of a lamp to 0 (optional fade)
- **Apply lamp defaults**: Write all configured lamp channel defaults into the DMX buffer and send

### Lamp presets

In instance config set **Preset slots per lamp** (default 5).

1. Set the lamp look with your actions.
2. Button with **Save lamp preset** → select lamp + slot.
3. Later **Recall lamp preset** → same lamp + slot.

Each lamp has a single config entry `lamp_X_presets`, e.g. `{"1":{"0":128,"1":200},"2":{"0":40,"1":90}}` (slot → channel index → DMX). Moving the project with **Export configuration** that includes connections keeps these presets.

### Feedbacks

- **DMX channel state by name**: Style when a configured lamp → channel equals a value
- **DMX state by channel**: Style when a numeric DMX channel equals a numeric value (variables supported)
