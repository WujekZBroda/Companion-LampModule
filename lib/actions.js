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

		set_lamp_channel_vsalue: {
			name: 'Set lamp channel value',
			options: [
				{
					id: 'lamp',
					label: 'select lamp',
					type: 'dropdown',
					choices: lamp_choices,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Select channel',
					choices: [{id: 'id', label : 'ddjjd'}],
					isVisible: (options) => options.lamp === `lamp_0`
				}
			],
			callback: async (action) => {
				console.log ('action: ', action)
				console.log(data)
				//console.log (options.lamp == 'lamp_1')
			}
		},
	}

	returnac.testAction = {
		name: 'test',
		options: [
			{
				id: 'test',
				label: "test",
				type: 'textinput',
				dafault: 'abs'

			}
		],
		callback: async (action) => {
			console.log('action', action)
		}
	}


	for (let l = 0; l < (self.config.lamp_number || 0); l++){
		const lamp_channels = []
		for (let c =0; c <(self.config[`lamp_${l}_channel_count`]); c++)
		lamp_channels.push({
			id: `lamp_${l}_channel_${c}`,
			label: self.config[`lamp_${l}_channel_${c}_name`]
		})
		console.log(lamp_channels)
		//const channels_visible(options) = new Function('config', `return ((${l} < (config.lamp_number || 0)) && (${c} < (config.lamp_${l}_channel_count || 0)))`)

		returnac['set_lamp_channel_vsalue'].options.push({
			id: `lamp_${l}_channels_select`,
			label: 'select channel',
			type: 'dropdown',
			choices: lamp_channels,
			//isVisible: (options) => channels_visible


			//dorobic funkcje ktora bedzie przekazywala funckje do pokazywania/odkrywania danej grupy kanalow dla danej lampy



		})
	}

	console.log(returnac)
	console.log(returnac['set_lamp_channel_vsalue'].options)



	return returnac
	
}

module.exports = {
	getActionDefinitions,
}
