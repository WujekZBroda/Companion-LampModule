## Lamp Module (ArtNet / DMX)

This module transmits ArtNet packets to the IP and universe you configure. Configure named lamps and channels in the instance settings, then control them from button actions.

Based on the Bitfocus [generic-artnet](https://github.com/bitfocus/companion-module-generic-artnet) Companion module (MIT).

If you need multiple universes, add multiple instances of this module.

### Configuration

- **Receiver IP** / **Universe** / update timers — ArtNet output
- **Number of Lamps** — how many lamps to configure (shown/hidden dynamically)
- Per lamp: name, channel count, and for each channel: name, DMX address, default value

Lamp channel **default** values are applied automatically when the instance starts. Saving config later does not reset live DMX values. Use the **Apply lamp defaults** action to push defaults on demand.

### Actions

- **Set Value**: Set a DMX channel to a value (optional fade)
- **Set Value by Custom Variable**: Same, with Companion variables
- **Set Complex Value**: Set multiple channel/value pairs at once
- **Offset Value**: Change a channel by a relative amount
- **Offset Value by Custom Variable**: Same, with Companion variables
- **Set lamp channel value**: Pick a configured lamp and channel, set DMX value
- **Apply lamp defaults**: Write all configured lamp channel defaults into the DMX buffer and send

### Feedbacks

- **Dmx channel state**: Style when a DMX channel equals a given value
