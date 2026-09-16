const { combineRgb } = require('@companion-module/base')
const { MAX_CHANNEL, MAX_VALUE } = require('./constants')

function getFeedbackDefinitions(self) {
	return {
		ChannelState: {
			name: 'Dmx channel state',
			type: 'boolean',
			label: 'Dmx channel state',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'dmx_channel',
					type: 'number',
					label: 'DMX Channel',
					default: 5,
					min: 1,
					max: MAX_CHANNEL,
				},
				{
					id: 'dmx_value',
					type: 'number',
					label: 'DMX Value',
					default: 5,
					min: 0,
					max: MAX_VALUE,
				},
			],
			callback: (feedback) => {
				const channel = Number(feedback.options.dmx_channel)
				const expected = Number(feedback.options.dmx_value)
				if (!Number.isFinite(channel) || channel < 1 || channel > MAX_CHANNEL) {
					return false
				}
				return self.data[channel - 1] === expected
			},
		},
	}
}

module.exports = {
	getFeedbackDefinitions,
}
