const { Regex } = require('@companion-module/base')
const { MAX_UNIVERSE, TIMER_SLOW_DEFAULT, TIMER_FAST_DEFAULT } = require('./constants')


module.exports = {
	getConfigFields(){
		const fields = [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value:
					'This module will transmit ArtNet packets to the ip and universe you specify below. If you need more universes, add multiple artnet instances.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Receiver IP',
				width: 6,
				default: '',
				regex: Regex.IP,
			},
			{
				type: 'number',
				id: 'universe',
				label: `Universe number (0-${MAX_UNIVERSE})`,
				width: 6,
				default: 0,
				min: 0,
				max: MAX_UNIVERSE,
				step: 1,
			},
			{
				type: 'number',
				id: 'timer_slow',
				label: `Update interval when no fades are running (ms)`,
				width: 6,
				default: TIMER_SLOW_DEFAULT,
				min: 10,
				step: 1,
			},
			{
				type: 'number',
				id: 'timer_fast',
				label: `Update interval for fades (ms)`,
				width: 6,
				default: TIMER_FAST_DEFAULT,
				min: 5,
				step: 1,
			},
			// konfirguracja lamp
			{
				type: 'number',
				id: 'lamp_number',
				label: 'Number of Lamps',
				default: 1,
				min: 1,
				max: 32,
				width: 2,
			},
			{
				type: 'static-text',
				id: 'holder',
				width: 10,
				label: ' ',
				value:' ',
			},
		]


		for (let l = 0; l < 8; l++) {
			
			const lampVisible = new Function('config', `return ${l} < (config.lamp_number || 0)`)
				// ----- LAMP HEADER ------
			fields.push({
				type: 'static-text',
				id: `lamp_${l}_header`,
				label: `Lamp ${l + 1}`,
				value: `--- Lamp ${l + 1} Configuration ---`,
				isVisible: lampVisible,
				width: 2,
			})

			// ---- Nazwa lampy ----
			fields.push({
				type: 'textinput',
				id: `lamp_${l}_name`,
				label: `Lamp ${l + 1} Name`,
				default: `Lamp ${l + 1}`,
				isVisible: lampVisible,
				width: 3,
			})

			// ---- Liczba kanałów ----
			fields.push({
				type: 'number',
				id: `lamp_${l}_channel_count`,
				label: `Lamp ${l + 1} Channel Count`,
				default: 0,
				min: 0,
				max: 16,
				isVisible: lampVisible,
				width: 2,
			})
			fields.push({
					type: 'static-text',
					id: `lamp_${l}_header_holder`,
					width: 5,
					label: ' ',
					value:' ',
					isVisible: lampVisible,
				})


			// =============================
			// DLA KAŻDEGO KANAŁU
			// =============================
			
			
			for (let c = 0; c < 4; c++) {
				const channelVisible = new Function('config', `return ((${l} < (config.lamp_number || 0)) && (${c} < (config.lamp_${l}_channel_count || 0)))`)

				//holder do wciecia
				fields.push({
					type: 'static-text',
					id: `lamp_${l}_channel_${c}_holder`,
					width: 2,
					label: ' ',
					value:' ',
					isVisible: channelVisible,
				})

				fields.push({
					type: 'textinput',
					id: `lamp_${l}_channel_${c}_name`,
					label: `Lamp ${l + 1} - Channel ${c + 1} Name`,
					default: `Channel ${c + 1}`,
					isVisible: channelVisible,
					width: 4,
				})
				
				// Numer DMX
				fields.push({
					type: 'number',
					id: `lamp_${l}_channel_${c}_dmx`,
					label: `Lamp ${l + 1} - Channel ${c + 1} DMX Address`,
					default: 1,
					min: 1,
					max: 512,
					isVisible: channelVisible,
					width: 3,
				})

				// Domyślna wartość DMX
				fields.push({
					type: 'number',
					id: `lamp_${l}_channel_${c}_default`,
					label: `Lamp ${l + 1} - Channel ${c + 1} Default Value`,
					default: 0,
					min: 0,
					max: 255,
					isVisible: channelVisible,
					width: 3,
				})
			
			}
		}

		return fields
	},
}
