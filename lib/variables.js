/**
 * Companion variables exposing current DMX values for configured lamp channels.
 * Use on button text, e.g. $(lamp-module:lamp_0_channel_0) — connection label may differ.
 * Conversion to % / Kelvin / RGB is left to Companion expressions / local variables.
 */

function getConfiguredChannels(config) {
	const channels = []
	const lampCount = config.lamp_number || 0

	for (let l = 0; l < lampCount; l++) {
		const lampName = config[`lamp_${l}_name`] || `Lamp ${l + 1}`
		const channelCount = config[`lamp_${l}_channel_count`] || 0

		for (let c = 0; c < channelCount; c++) {
			const channelId = `lamp_${l}_channel_${c}`
			const channelName = config[`${channelId}_name`] || `Channel ${c + 1}`
			const dmxAddress = Number(config[`${channelId}_dmx`])

			channels.push({
				variableId: channelId,
				dmxVariableId: Number.isFinite(dmxAddress) ? `dmx_${Math.trunc(dmxAddress)}` : null,
				name: `${lampName} / ${channelName}`,
				dmxAddress,
			})
		}
	}

	return channels
}

function getVariableDefinitions(config) {
	const definitions = []
	const seenDmx = new Set()

	for (const ch of getConfiguredChannels(config)) {
		definitions.push({
			variableId: ch.variableId,
			name: `DMX value: ${ch.name}`,
		})

		if (ch.dmxVariableId && !seenDmx.has(ch.dmxVariableId)) {
			seenDmx.add(ch.dmxVariableId)
			definitions.push({
				variableId: ch.dmxVariableId,
				name: `DMX address ${ch.dmxAddress}`,
			})
		}
	}

	return definitions
}

function getVariableValues(config, data) {
	const values = {}
	const seenDmx = new Set()

	for (const ch of getConfiguredChannels(config)) {
		const dmx = Number(ch.dmxAddress)
		let value = 0
		if (Number.isFinite(dmx) && dmx >= 1 && dmx <= data.length) {
			value = data[dmx - 1]
		}

		values[ch.variableId] = value

		if (ch.dmxVariableId && !seenDmx.has(ch.dmxVariableId)) {
			seenDmx.add(ch.dmxVariableId)
			values[ch.dmxVariableId] = value
		}
	}

	return values
}

module.exports = {
	getConfiguredChannels,
	getVariableDefinitions,
	getVariableValues,
}
