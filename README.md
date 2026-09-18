# Companion Lamp Module

Companion module for controlling DMX lamps over ArtNet, with named lamps/channels in the instance config.

**Version:** 0.0.1 · Module id: `lamp-module`

## Attribution / upstream

This module is a **derivative work** of the Bitfocus Companion module
[companion-module-generic-artnet](https://github.com/bitfocus/companion-module-generic-artnet)
(also known as **generic-artnet**), originally by Bitfocus AS, William Viker, and Håkon Nessjøen.

It is not a drop-in replacement for the official `generic-artnet` module. It is maintained as a separate module (`lamp-module`) with lamp-oriented configuration and actions on top of the ArtNet send / fade foundation from upstream.

Upstream project: [https://github.com/bitfocus/companion-module-generic-artnet](https://github.com/bitfocus/companion-module-generic-artnet)



Comparison below is against the **current upstream repository**.

## Changes relative to [generic-artnet](https://github.com/bitfocus/companion-module-generic-artnet)



### Identity / packaging


|                          | Upstream `generic-artnet`                    | This module (`v0.0.1`)                                       |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------ |
| Module id                | `generic-artnet`                             | `lamp-module`                                                |
| Shortname                | `artnet`                                     | `lamp-module`                                                |
| Products                 | `Art-Net`                                    | `LAMP MODULE`                                                |
| `legacyIds`              | `["artnet"]`                                 | `[]` (new module; no migration of official ArtNet instances) |
| Repository / maintainers | Bitfocus                                     | This fork’s repo and maintainers                             |
| Docs                     | Minimal README + HELP for raw ArtNet actions | README attribution, change list, lamp-oriented HELP          |




### Configuration

Upstream config is only: Receiver IP, universe, slow/fast timers (static field list).

This module adds:

- **Number of lamps** (up to 32) with dynamic show/hide via `isVisible`
- Per lamp: name, channel count (up to 8)
- Per channel: name, DMX address, default value
- Config form updates when lamp/channel counts change without restarting Companion
- Action/feedback definitions rebuild on config save (so lamp dropdowns stay in sync without restart)



### Actions

**From upstream (merged / updated):**

- **Set Value**, **Set Complex Value**, **Offset Value** — same roles as upstream, but number fields are text inputs with `useVariables: { local: true }` (custom + local variables / expressions; Companion v5). Separate “by custom variable” actions were removed.

**Added:**

- **Set Value by lamp channel** — select configured lamp → channel → value (optional fade)
- **Offset Value by Channel Name** — pick a named channel from a list, apply offset
- **Apply lamp defaults** — write all configured lamp channel defaults into the DMX buffer and send

### Defaults

Upstream has no lamp defaults.

This module:

- Applies lamp channel defaults **once** when the instance starts
- Does **not** reset live DMX values on every config save
- Re-applies on demand via **Apply lamp defaults**

### Feedbacks

Upstream has **no** feedbacks.

This module adds:

- **DMX channel state by name** — lamp → channel selectors (like Set Value by lamp channel)
- **DMX state by channel** — numeric DMX channel + numeric value (variables supported)

### Runtime / correctness vs upstream code

- **Removed** `lib/discovery.js` (upstream still ships the file; discovery remains commented out / unused there too)
- **Fixed** upstream off-by-one in **Offset Value by Custom Variable** (`self.data[channel]` used a 1-based string index)
- **Validate** DMX channel range for custom-variable / complex set paths
- **Round and clamp** fade steps to integer DMX 0–255 (upstream writes floats into the buffer)
- Safer instance destroy when transitions were never created



### Unchanged from upstream (core ArtNet behaviour)

- 512-channel DMX buffer and ArtNet client send to host / universe
- Linear fades via the transitions tick engine
- Slow poll when no fades are running; fast tick during fades



### Note on dependencies

This fork uses `@companion-module/base` **~1.11.3** so action/feedback fields can use `useVariables: { local: true }` (custom + local variables), which aligns with Companion 3.5+ / 4 / 5 variable pickers. Upstream may use a different base version; bump further if you target a newer Companion API exclusively.

## License

MIT — see [LICENSE](LICENSE).

The original MIT copyright notice and permission notice from Bitfocus AS / the generic-artnet authors are retained. Additional copyright for modifications to this lamp module is listed in `LICENSE`.

## Usage

See [companion/HELP.md](companion/HELP.md) for actions and configuration overview.

For local development in Companion: enable **Developer Modules**, set the path to the **parent** folder of this repo, run `yarn install` / `npm install` here, then add the connection shown as **Generic: LAMPMODULE** (see `products` in `companion/manifest.json`). Manifest must include `"legacyIds": []`.