const { MAX_CHANNEL, MAX_VALUE, MAX_PRESETS_PER_LAMP, DEFAULT_PRESETS_PER_LAMP } = require('./constants')

/**
 * Config key: lamp_{L}_presets
 * Value: JSON object — one entry for the whole lamp:
 * {
 *   "1": { "0": 128, "1": 200 },   // preset slot → { channelIndex: dmxValue }
 *   "2": { "0": 40, "1": 90 }
 * }
 * Stored in connection config → included in Companion export/import.
 */

function presetsConfigKey(lampIndex) {
	return `lamp_${lampIndex}_presets`
}

function parseLampPresets(raw) {
	if (raw == null || raw === '') return {}
	if (typeof raw === 'object' && !Array.isArray(raw)) return { ...raw }

	try {
		const parsed = JSON.parse(String(raw))
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
	} catch (_e) {
		// ignore invalid JSON
	}
	return {}
}

function serializeLampPresets(store) {
	return JSON.stringify(store || {})
}

function getPresetSlotCount(config) {
	const n = Number(config.preset_slots)
	if (!Number.isFinite(n)) return DEFAULT_PRESETS_PER_LAMP
	return Math.min(MAX_PRESETS_PER_LAMP, Math.max(1, Math.trunc(n)))
}

function getPresetChoices(config) {
	const count = getPresetSlotCount(config)
	const choices = []
	for (let i = 1; i <= count; i++) {
		choices.push({ id: i, label: `Preset ${i}` })
	}
	return choices
}

function snapshotLampChannels(config, data, lampIndex) {
	const snapshot = {}
	const channelCount = config[`lamp_${lampIndex}_channel_count`] || 0

	for (let c = 0; c < channelCount; c++) {
		const dmxAddress = Number(config[`lamp_${lampIndex}_channel_${c}_dmx`])
		let value = 0
		if (Number.isFinite(dmxAddress) && dmxAddress >= 1 && dmxAddress <= MAX_CHANNEL) {
			value = data[dmxAddress - 1]
		}
		if (!Number.isFinite(value)) value = 0
		snapshot[String(c)] = Math.min(MAX_VALUE, Math.max(0, Math.round(value)))
	}

	return snapshot
}

function applyLampPresetSnapshot(config, data, lampIndex, snapshot, runFade) {
	if (!snapshot || typeof snapshot !== 'object') return 0

	const channelCount = config[`lamp_${lampIndex}_channel_count`] || 0
	let applied = 0

	for (let c = 0; c < channelCount; c++) {
		const raw = snapshot[String(c)]
		if (raw === undefined) continue

		const dmxAddress = Number(config[`lamp_${lampIndex}_channel_${c}_dmx`])
		if (!Number.isFinite(dmxAddress) || dmxAddress < 1 || dmxAddress > MAX_CHANNEL) continue

		const value = Math.min(MAX_VALUE, Math.max(0, Math.round(Number(raw) || 0)))
		runFade(dmxAddress - 1, value)
		applied++
	}

	return applied
}

module.exports = {
	presetsConfigKey,
	parseLampPresets,
	serializeLampPresets,
	getPresetSlotCount,
	getPresetChoices,
	snapshotLampChannels,
	applyLampPresetSnapshot,
}
