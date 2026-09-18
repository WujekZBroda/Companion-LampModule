const { MAX_CHANNEL, MAX_VALUE } = require('./constants')

/** Companion v3.5+ / v4 / v5: custom + local variables in text fields */
const USE_VARIABLES = { local: true }

/** @returns {number|null} 0-based channel index, or null if invalid */
function parseChannelIndex(raw) {
	const channel = Number(raw)
	if (!Number.isFinite(channel)) return null
	const ch = Math.trunc(channel)
	if (ch < 1 || ch > MAX_CHANNEL) return null
	return ch - 1
}

function clampDmxValue(raw) {
	const val = Number(raw)
	if (isNaN(val)) return 0
	return Math.min(MAX_VALUE, Math.max(0, Math.round(val)))
}

async function parseOption(context, value) {
	// Must use action/feedback context so local variables ($(local:...), $(this:...)) resolve
	return context.parseVariablesInString(String(value ?? ''))
}

function getLampChoices(config) {
	const choices = [{ id: '', label: 'Select a lamp...' }]
	for (let i = 0; i < (config.lamp_number || 0); i++) {
		choices.push({
			id: `lamp_${i}`,
			label: config[`lamp_${i}_name`] || `Lamp ${i + 1}`,
		})
	}
	return choices
}

/** Flat list of all configured lamp channels (for “by name” pickers). */
function getNamedChannelChoices(config) {
	const choices = [{ id: '', label: 'Select a channel...' }]
	for (let l = 0; l < (config.lamp_number || 0); l++) {
		const lampName = config[`lamp_${l}_name`] || `Lamp ${l + 1}`
		const channelCount = config[`lamp_${l}_channel_count`] || 0
		for (let c = 0; c < channelCount; c++) {
			const channelName = config[`lamp_${l}_channel_${c}_name`] || `Channel ${c + 1}`
			choices.push({
				id: `lamp_${l}_channel_${c}`,
				label: `${lampName} / ${channelName}`,
			})
		}
	}
	return choices
}

function getChannelsForLamp(config, lampIndex) {
	const choices = []
	const channelCount = config[`lamp_${lampIndex}_channel_count`] || 0
	for (let c = 0; c < channelCount; c++) {
		choices.push({
			id: `lamp_${lampIndex}_channel_${c}`,
			label: config[`lamp_${lampIndex}_channel_${c}_name`] || `Channel ${c + 1}`,
		})
	}
	return choices.length ? choices : [{ id: '', label: 'No channels configured' }]
}

/**
 * Append per-lamp channel dropdowns (visible only for the selected lamp).
 * Option ids: lamp_N_channel
 */
function appendLampChannelSelectOptions(options, config) {
	for (let l = 0; l < (config.lamp_number || 0); l++) {
		const lampChannels = getChannelsForLamp(config, l)
		options.push({
			id: `lamp_${l}_channel`,
			label: 'Select channel',
			type: 'dropdown',
			default: lampChannels[0]?.id ?? '',
			choices: lampChannels,
			isVisible: new Function('options', `return options.lamp === 'lamp_${l}'`),
		})
	}
}

function resolveLampChannelId(options) {
	const lampId = options.lamp
	if (!lampId) return null
	return options[`${lampId}_channel`] || null
}

function resolveDmxIndexFromChannelId(config, channelId) {
	if (!channelId) return null
	return parseChannelIndex(config[`${channelId}_dmx`])
}

module.exports = {
	USE_VARIABLES,
	MAX_CHANNEL,
	MAX_VALUE,
	parseChannelIndex,
	clampDmxValue,
	parseOption,
	getLampChoices,
	getNamedChannelChoices,
	getChannelsForLamp,
	appendLampChannelSelectOptions,
	resolveLampChannelId,
	resolveDmxIndexFromChannelId,
}
