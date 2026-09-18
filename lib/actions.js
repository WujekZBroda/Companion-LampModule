const {
	USE_VARIABLES,
	MAX_CHANNEL,
	MAX_VALUE,
	parseChannelIndex,
	clampDmxValue,
	parseOption,
	getLampChoices,
	getNamedChannelChoices,
	appendLampChannelSelectOptions,
	resolveLampChannelId,
	resolveDmxIndexFromChannelId,
} = require('./lamp-utils')
const { getPresetChoices } = require('./presets')

function parseLampIndex(lampId) {
	if (typeof lampId !== 'string' || lampId.indexOf('lamp_') !== 0) return null
	const n = Number(lampId.slice(5))
	if (!Number.isFinite(n) || n < 0) return null
	return Math.trunc(n)
}

function getActionDefinitions(self) {
	const config = self.config || {}
	const lampChoices = getLampChoices(config)
	const presetChoices = getPresetChoices(config)

	const actions = {
		set: {
			name: 'Set Value',
			options: [
				{
					type: 'textinput',
					label: `Channel (Range 1-${MAX_CHANNEL})`,
					id: 'channel',
					default: '1',
					useVariables: USE_VARIABLES,
					tooltip: 'Supports custom variables, local variables, and expressions (Companion v5).',
				},
				{
					type: 'textinput',
					label: `Value (Range 0-${MAX_VALUE})`,
					id: 'value',
					default: '0',
					useVariables: USE_VARIABLES,
				},
				{
					type: 'textinput',
					label: 'Fade time (ms)',
					id: 'duration',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (action, context) => {
				const [channel, val, duration] = await Promise.all([
					parseOption(context, action.options.channel),
					parseOption(context, action.options.value),
					parseOption(context, action.options.duration),
				])

				const channelIndex = parseChannelIndex(channel)
				if (channelIndex === null) {
					self.log('error', `Set Value: invalid channel "${channel}"`)
					return
				}

				const durationMs = Number(duration)
				self.transitions.run(channelIndex, clampDmxValue(val), isNaN(durationMs) ? 0 : durationMs)
			},
		},

		set_complex: {
			name: 'Set Complex Value',
			options: [
				{
					type: 'textinput',
					label: `Channel (Range 1-${MAX_CHANNEL}), Value (Range 0-${MAX_VALUE});`,
					tooltip:
						'Each parameter should be separated by a comma (,) and each group by a semicolon (;). Supports variables.',
					id: 'params',
					default: '1,0;',
					useVariables: USE_VARIABLES,
				},
				{
					type: 'textinput',
					label: 'Fade time (ms)',
					id: 'duration',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (action, context) => {
				let [params, duration] = await Promise.all([
					parseOption(context, action.options.params),
					parseOption(context, action.options.duration),
				])

				params = params.replace(/;+$/, '')
				const params_groups = params.split(';')
				const durationMs = Number(duration)
				const fade = isNaN(durationMs) ? 0 : durationMs

				for (let i = 0; i < params_groups.length; i++) {
					if (params_groups[i].indexOf(',') === -1) {
						self.log(
							'error',
							'One or more of your parameters are set incorrectly in the "Set Complex Value" action: ' +
								params_groups[i]
						)
						return
					}

					const params_values = params_groups[i].split(',')
					const channelIndex = parseChannelIndex(params_values[0])
					if (channelIndex === null) {
						self.log('error', `Set Complex Value: invalid channel "${params_values[0]}"`)
						continue
					}

					self.transitions.run(channelIndex, clampDmxValue(params_values[1]), fade)
				}
			},
		},

		offset: {
			name: 'Offset Value',
			options: [
				{
					type: 'textinput',
					label: `Channel (Range 1-${MAX_CHANNEL})`,
					id: 'channel',
					default: '1',
					useVariables: USE_VARIABLES,
					tooltip: 'Supports custom variables, local variables, and expressions (Companion v5).',
				},
				{
					type: 'textinput',
					label: 'Value change',
					id: 'value',
					default: '1',
					useVariables: USE_VARIABLES,
				},
				{
					type: 'textinput',
					label: 'Fade time (ms)',
					id: 'duration',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (action, context) => {
				const [channel, val, duration] = await Promise.all([
					parseOption(context, action.options.channel),
					parseOption(context, action.options.value),
					parseOption(context, action.options.duration),
				])

				const channelIndex = parseChannelIndex(channel)
				if (channelIndex === null) {
					self.log('error', `Offset Value: invalid channel "${channel}"`)
					return
				}

				const offset = Number(val)
				const newval = clampDmxValue(self.data[channelIndex] + (isNaN(offset) ? 0 : offset))
				const durationMs = Number(duration)
				self.transitions.run(channelIndex, newval, isNaN(durationMs) ? 0 : durationMs)
			},
		},

		set_value_by_lamp_channel: {
			name: 'Set Value by lamp channel',
			options: [
				{
					id: 'lamp',
					label: 'Select lamp',
					type: 'dropdown',
					default: '',
					choices: lampChoices,
				},
			],
			callback: async (action, context) => {
				const channelId = resolveLampChannelId(action.options)
				if (!channelId) {
					self.log('error', 'Set Value by lamp channel: lamp/channel not selected')
					return
				}

				const channelIndex = resolveDmxIndexFromChannelId(config, channelId)
				if (channelIndex === null) {
					self.log('error', `Set Value by lamp channel: invalid DMX address for ${channelId}`)
					return
				}

				const [val, duration] = await Promise.all([
					parseOption(context, action.options.value),
					parseOption(context, action.options.duration),
				])
				const durationMs = Number(duration)
				self.transitions.run(channelIndex, clampDmxValue(val), isNaN(durationMs) ? 0 : durationMs)
			},
		},

		offset_value_by_channel_name: {
			name: 'Offset Value by Channel Name',
			options: [
				{
					id: 'channel_name',
					label: 'Select channel',
					type: 'dropdown',
					default: '',
					choices: getNamedChannelChoices(config),
				},
				{
					type: 'textinput',
					label: 'Value change',
					id: 'value',
					default: '1',
					useVariables: USE_VARIABLES,
				},
				{
					type: 'textinput',
					label: 'Fade time (ms)',
					id: 'duration',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (action, context) => {
				const channelId = action.options.channel_name
				if (!channelId) {
					self.log('error', 'Offset Value by Channel Name: no channel selected')
					return
				}

				const channelIndex = resolveDmxIndexFromChannelId(config, channelId)
				if (channelIndex === null) {
					self.log('error', `Offset Value by Channel Name: invalid DMX address for ${channelId}`)
					return
				}

				const [val, duration] = await Promise.all([
					parseOption(context, action.options.value),
					parseOption(context, action.options.duration),
				])
				const offset = Number(val)
				const newval = clampDmxValue(self.data[channelIndex] + (isNaN(offset) ? 0 : offset))
				const durationMs = Number(duration)
				self.transitions.run(channelIndex, newval, isNaN(durationMs) ? 0 : durationMs)
			},
		},

		save_lamp_preset: {
			name: 'Save lamp preset',
			options: [
				{
					id: 'lamp',
					label: 'Select lamp',
					type: 'dropdown',
					default: '',
					choices: lampChoices,
				},
				{
					id: 'preset',
					label: 'Preset slot',
					type: 'dropdown',
					default: presetChoices[0]?.id ?? 1,
					choices: presetChoices,
				},
			],
			callback: (action) => {
				const lampIndex = parseLampIndex(action.options.lamp)
				if (lampIndex === null) {
					self.log('error', 'Save lamp preset: no lamp selected')
					return
				}
				self.saveLampPreset(lampIndex, action.options.preset)
			},
		},

		recall_lamp_preset: {
			name: 'Recall lamp preset',
			options: [
				{
					id: 'lamp',
					label: 'Select lamp',
					type: 'dropdown',
					default: '',
					choices: lampChoices,
				},
				{
					id: 'preset',
					label: 'Preset slot',
					type: 'dropdown',
					default: presetChoices[0]?.id ?? 1,
					choices: presetChoices,
				},
				{
					type: 'textinput',
					label: 'Fade time (ms)',
					id: 'duration',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (action, context) => {
				const lampIndex = parseLampIndex(action.options.lamp)
				if (lampIndex === null) {
					self.log('error', 'Recall lamp preset: no lamp selected')
					return
				}
				const duration = await parseOption(context, action.options.duration)
				self.recallLampPreset(lampIndex, action.options.preset, duration)
			},
		},

		lamp_off: {
			name: 'Lamp off',
			options: [
				{
					id: 'lamp',
					label: 'Select lamp',
					type: 'dropdown',
					default: '',
					choices: lampChoices,
				},
				{
					type: 'textinput',
					label: 'Fade time (ms)',
					id: 'duration',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (action, context) => {
				const lampIndex = parseLampIndex(action.options.lamp)
				if (lampIndex === null) {
					self.log('error', 'Lamp off: no lamp selected')
					return
				}
				const duration = await parseOption(context, action.options.duration)
				self.lampOff(lampIndex, duration)
			},
		},

		apply_lamp_defaults: {
			name: 'Apply lamp defaults',
			options: [],
			callback: () => {
				self.applyLampDefaults()
				self.do_send()
			},
		},
	}

	const setByLamp = actions.set_value_by_lamp_channel
	appendLampChannelSelectOptions(setByLamp.options, config)
	setByLamp.options.push(
		{
			id: 'value',
			label: 'Value',
			type: 'textinput',
			default: '0',
			useVariables: USE_VARIABLES,
			isVisible: new Function(
				'options',
				`return typeof options.lamp === 'string' && options.lamp.indexOf('lamp_') === 0`
			),
		},
		{
			id: 'duration',
			label: 'Fade time (ms)',
			type: 'textinput',
			default: '0',
			useVariables: USE_VARIABLES,
			isVisible: new Function(
				'options',
				`return typeof options.lamp === 'string' && options.lamp.indexOf('lamp_') === 0`
			),
		}
	)

	return actions
}

module.exports = {
	getActionDefinitions,
}
