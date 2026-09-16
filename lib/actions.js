const { MAX_CHANNEL, MAX_VALUE } = require('./constants')
function getActionDefinitions(self) {
	const lamp_choices = []

	for (let i = 0; i < (self.config.lamp_number || 0); i++){
		lamp_choices.push({
			id: `lamp_${i}`,
			label: self.config[`lamp_${i}_name`] || `Lamp ${i + 1}`
		})
	}


	const returnac =  {
		set: {
			name: 'Set Value',
			options: [
				{
					type: 'number',
					label: `Channel (Range 1-${MAX_CHANNEL})`,
					id: 'channel',
					default: 1,
					min: 1,
					max: MAX_CHANNEL,
					step: 1,
				},
				{
					type: 'number',
					label: `Value (Range 0-${MAX_VALUE})`,
					id: 'value',
					default: 0,
					min: 0,
					max: MAX_VALUE,
					step: 1,
				},
				{
					type: 'number',
					label: `Fade time (ms)`,
					id: 'duration',
					default: 0,
					min: 0,
					step: 1,
				},
			],
			callback: (action) => {
				const val = Number(action.options.value)
				const duration = Number(action.options.duration)
				self.transitions.run(action.options.channel - 1, isNaN(val) ? 0 : val, isNaN(duration) ? 0 : duration)
			},
		},
		set_customvariable: {
			name: 'Set Value by Custom Variable',
			options: [
				{
					type: 'textinput',
					label: `Channel (Range 1-${MAX_CHANNEL})`,
					id: 'channel',
					default: '1',
					useVariables: true,
				},
				{
					type: 'textinput',
					label: `Value (Range 0-${MAX_VALUE})`,
					id: 'value',
					default: '0',
					useVariables: true,
				},
				{
					type: 'textinput',
					label: `Fade time (ms)`,
					id: 'duration',
					default: '0',
					useVariables: true,
				},
			],
			callback: async (action) => {
				const [channel, val, duration] = await Promise.all([
					self.parseVariablesInString(action.options.channel),
					self.parseVariablesInString(action.options.value),
					self.parseVariablesInString(action.options.duration),
				])

				self.transitions.run(Number(channel) - 1, isNaN(val) ? 0 : Number(val), isNaN(duration) ? 0 : Number(duration))
			},
		},
		set_complex: {
			name: 'Set Complex Value',
			options: [
				{
					type: 'textinput',
					label: `Channel (Range 1-${MAX_CHANNEL}), Value (Range 0-${MAX_VALUE});`,
					tooltip:
						'Each parameter should be separated by a colon (,) and each group of parameters should be separated by a semicolon (;)',
					id: 'params',
					default: '1,0;',
					useVariables: true,
				},
				{
					type: 'textinput',
					label: `Fade time (ms)`,
					id: 'duration',
					default: 0,
					min: 0,
					step: 1,
					useVariables: true,
				},
			],
			callback: async (action) => {
				let [params, duration] = await Promise.all([
					self.parseVariablesInString(action.options.params),
					self.parseVariablesInString(action.options.duration),
				])

				params = params.replace(/;+$/, '') //remove any trailing ';' as they are not needed

				let params_groups = params.split(';')

				for (let i = 0; i < params_groups.length; i++) {
					if (params_groups[i].indexOf(',') === -1) {
						self.log(
							'error',
							'One or more of your parameters are set incorrectly in the "Set Complex Value" action: ' +
								params_groups[i]
						)
						return
					}

					let params_values = params_groups[i].split(',')

					let channel = Number(params_values[0])

					let val = Number(params_values[1])

					duration = Number(duration)

					self.transitions.run(channel - 1, isNaN(val) ? 0 : val, isNaN(duration) ? 0 : duration)
				}
			},
		},
		offset: {
			name: 'Offset Value',
			options: [
				{
					type: 'number',
					label: `Channel (Range 1-${MAX_CHANNEL})`,
					id: 'channel',
					default: 1,
					min: 1,
					max: MAX_CHANNEL,
					step: 1,
				},
				{
					type: 'number',
					label: `Value change`,
					id: 'value',
					default: 1,
					min: -MAX_VALUE,
					max: MAX_VALUE,
					step: 1,
				},
				{
					type: 'number',
					label: `Fade time (ms)`,
					id: 'duration',
					default: 0,
					min: 0,
					step: 1,
				},
			],
			callback: (action) => {
				const channel = action.options.channel - 1
				const val = Number(action.options.value)
				const duration = Number(action.options.duration)
				const newval = Math.min(MAX_VALUE, Math.max(0, self.data[channel] + val)) // clamp to range

				self.transitions.run(action.options.channel - 1, isNaN(newval) ? 0 : newval, isNaN(duration) ? 0 : duration)
			},
		},
		offset_customvariable: {
			name: 'Offset Value by Custom Variable',
			options: [
				{
					type: 'textinput',
					label: `Channel (Range 1-${MAX_CHANNEL})`,
					id: 'channel',
					default: '1',
					useVariables: true,
				},
				{
					type: 'textinput',
					label: `Value change`,
					id: 'value',
					default: '1',
					useVariables: true,
				},
				{
					type: 'textinput',
					label: `Fade time (ms)`,
					id: 'duration',
					default: '0',
					useVariables: true,
				},
			],
			callback: async (action) => {
				const [channel, val, duration] = await Promise.all([
					self.parseVariablesInString(action.options.channel),
					self.parseVariablesInString(action.options.value),
					self.parseVariablesInString(action.options.duration),
				])

				let newval = Math.min(MAX_VALUE, Math.max(0, self.data[channel] + Number(val))) // clamp to range

				self.transitions.run(Number(channel) - 1, isNaN(newval) ? 0 : newval, isNaN(duration) ? 0 : Number(duration))
			},
		},

		set_lamp_channel_value: {
			name: 'Set lamp channel value',
			options: [
				{
					id: 'lamp',
					label: 'Select lamp',
					type: 'dropdown',
					default: '',
					choices: [{ id: '', label: 'Select a lamp...' }, ...lamp_choices],
				},
			],
			callback: (action) => {
				const lampId = action.options.lamp
				if (!lampId) {
					self.log('error', 'Set lamp channel value: no lamp selected')
					return
				}

				const channelId = action.options[`${lampId}_channel`]
				if (!channelId) {
					self.log('error', 'Set lamp channel value: no channel selected')
					return
				}

				const dmxAddress = Number(self.config[`${channelId}_dmx`])
				if (!Number.isFinite(dmxAddress) || dmxAddress < 1 || dmxAddress > MAX_CHANNEL) {
					self.log('error', `Set lamp channel value: invalid DMX address for ${channelId}`)
					return
				}

				const val = Number(action.options.value)
				self.transitions.run(dmxAddress - 1, isNaN(val) ? 0 : val, 0)
			},
		},
	}

	const lampAction = returnac.set_lamp_channel_value

	for (let l = 0; l < (self.config.lamp_number || 0); l++) {
		const lampChannels = []
		const channelCount = self.config[`lamp_${l}_channel_count`] || 0

		for (let c = 0; c < channelCount; c++) {
			lampChannels.push({
				id: `lamp_${l}_channel_${c}`,
				label: self.config[`lamp_${l}_channel_${c}_name`] || `Channel ${c + 1}`,
			})
		}

		lampAction.options.push({
			id: `lamp_${l}_channel`,
			label: 'Select channel',
			type: 'dropdown',
			default: lampChannels[0]?.id ?? '',
			choices: lampChannels.length
				? lampChannels
				: [{ id: '', label: 'No channels configured' }],
			// new Function keeps isVisible serializable across Companion IPC
			isVisible: new Function('options', `return options.lamp === 'lamp_${l}'`),
		})
	}

	lampAction.options.push({
		id: 'value',
		label: 'Value',
		type: 'number',
		default: 0,
		min: 0,
		max: MAX_VALUE,
		step: 1,
		isVisible: new Function(
			'options',
			`return typeof options.lamp === 'string' && options.lamp.indexOf('lamp_') === 0`
		),
	})

	return returnac
}

module.exports = {
	getActionDefinitions,
}
