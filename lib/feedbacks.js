const { combineRgb } = require('@companion-module/base')
const {
	USE_VARIABLES,
	MAX_CHANNEL,
	clampDmxValue,
	parseOption,
	parseChannelIndex,
	getLampChoices,
	appendLampChannelSelectOptions,
	resolveLampChannelId,
	resolveDmxIndexFromChannelId,
} = require('./lamp-utils')

function getFeedbackDefinitions(self) {
	const config = self.config || {}
	const lampChoices = getLampChoices(config)

	const feedbacks = {
		ChannelStateByName: {
			name: 'DMX channel state by name',
			type: 'boolean',
			label: 'DMX channel state by name',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'lamp',
					label: 'Select lamp',
					type: 'dropdown',
					default: '',
					choices: lampChoices,
				},
			],
			callback: async (feedback, context) => {
				const channelId = resolveLampChannelId(feedback.options)
				const channelIndex = resolveDmxIndexFromChannelId(config, channelId)
				if (channelIndex === null) return false

				const expectedRaw = await parseOption(context, feedback.options.dmx_value)
				const expected = clampDmxValue(expectedRaw)
				return self.data[channelIndex] === expected
			},
		},

		ChannelState: {
			name: 'DMX state by channel',
			type: 'boolean',
			label: 'DMX state by channel',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'dmx_channel',
					type: 'textinput',
					label: `DMX Channel (1-${MAX_CHANNEL})`,
					default: '1',
					useVariables: USE_VARIABLES,
				},
				{
					id: 'dmx_value',
					type: 'textinput',
					label: 'DMX Value',
					default: '0',
					useVariables: USE_VARIABLES,
				},
			],
			callback: async (feedback, context) => {
				const channelRaw = await parseOption(context, feedback.options.dmx_channel)
				const channelIndex = parseChannelIndex(channelRaw)
				if (channelIndex === null) return false

				const expectedRaw = await parseOption(context, feedback.options.dmx_value)
				const expected = clampDmxValue(expectedRaw)
				return self.data[channelIndex] === expected
			},
		},
	}

	appendLampChannelSelectOptions(feedbacks.ChannelStateByName.options, config)
	feedbacks.ChannelStateByName.options.push({
		id: 'dmx_value',
		type: 'textinput',
		label: 'DMX Value',
		default: '0',
		useVariables: USE_VARIABLES,
		isVisible: new Function(
			'options',
			`return typeof options.lamp === 'string' && options.lamp.indexOf('lamp_') === 0`
		),
	})

	return feedbacks
}

module.exports = {
	getFeedbackDefinitions,
}
