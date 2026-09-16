const artnet = require('artnet-node')
const artnetClient = artnet.Client
const { UpgradeScripts } = require('./upgrade')
const { getFeedbackDefinitions } = require('./feedbacks')
const { Transitions } = require('./transitions')
const { MAX_CHANNEL, MAX_VALUE, TIMER_SLOW_DEFAULT, TIMER_FAST_DEFAULT } = require('./constants')
const { getActionDefinitions } = require('./actions')
const { InstanceBase, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const { getConfigFields } = require('./config')

class ArtnetInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.data = new Array(MAX_CHANNEL).fill(0)
	}

	async init(config) {
		await this.configUpdated(config)
		// Option A: apply configured lamp defaults once at instance start
		this.applyLampDefaults()
		if (this.client) {
			this.do_send()
		}
	}

	/**
	 * Write configured lamp channel defaults into the DMX buffer.
	 * Used at first start (init) and by the "Apply lamp defaults" action.
	 */
	applyLampDefaults() {
		if (this.transitions) {
			this.transitions.stopAll()
		}

		const lampCount = this.config.lamp_number || 0

		for (let l = 0; l < lampCount; l++) {
			const channelCount = this.config[`lamp_${l}_channel_count`] || 0

			for (let c = 0; c < channelCount; c++) {
				const dmxAddress = Number(this.config[`lamp_${l}_channel_${c}_dmx`])
				if (!Number.isFinite(dmxAddress) || dmxAddress < 1 || dmxAddress > MAX_CHANNEL) {
					continue
				}

				let value = Number(this.config[`lamp_${l}_channel_${c}_default`])
				if (!Number.isFinite(value)) value = 0
				value = Math.min(MAX_VALUE, Math.max(0, Math.round(value)))

				this.data[dmxAddress - 1] = value
			}
		}
	}

	async configUpdated(config) {
		this.config = config

		// Rebuild actions/feedbacks from current lamp config — no module restart needed
		this.setActionDefinitions(getActionDefinitions(this))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this))

		if (this.transitions) this.transitions.stopAll()
		this.transitions = new Transitions(this.data, this.config.timer_fast || TIMER_FAST_DEFAULT, this.do_send.bind(this))

		// Close current client
		if (this.client !== undefined) {
			this.client.close()
			delete this.client
		}

		if (this.config.host) {
			this.client = new artnetClient(this.config.host, 6454, this.config.universe || 0)

			this.updateStatus(InstanceStatus.Ok)
			// Re-send current buffer (does not re-apply lamp defaults)
			this.do_send()
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Missing host')
		}

		if (this.slow_send_timer) {
			clearInterval(this.slow_send_timer)
			delete this.slow_send_timer
		}

		this.slow_send_timer = setInterval(() => {
			// Skip the slow poll if a transition is running
			if (!this.transitions.isRunning()) {
				this.do_send()
			}
		}, this.config.timer_slow || TIMER_SLOW_DEFAULT)
	}

	async destroy() {
		if (this.transitions) {
			this.transitions.stopAll()
		}

		if (this.client) {
			this.client.close()
			delete this.client
		}

		if (this.slow_send_timer) {
			clearInterval(this.slow_send_timer)
			delete this.slow_send_timer
		}
	}

	do_send() {
		if (this.client) {
			this.client.send(this.data)
			this.checkFeedbacks('ChannelState')
		}
	}

	getConfigFields() {
		return getConfigFields.call(this)
	}
}

runEntrypoint(ArtnetInstance, UpgradeScripts)
