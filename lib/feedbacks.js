const { combineRgb } = require('@companion-module/base')


function getFeedbackDefinitions(self){
	return{
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
					label: 'DMX CHANEL',
					default: 5,
					min: 1,
					max: 512,
				},
				{
					id: 'dmx_value',
					type: 'number',
					label: 'DMX VALLUE',
					default: 5,
					min: 0,
					max: 255,
				},
			],
			callback: (feedback) => {
				//console.log(self.data)
				if (self.data[feedback.options.dmx_channel-1] == feedback.options.dmx_value){
				//if (feedback.options.num > 5) {	
				return true
				} else {
					return false
				}
			},
		}
	}
}


module.exports = {
	getFeedbackDefinitions,
}
