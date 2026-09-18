const artnet = require('artnet-node')
const artnetClient = artnet.Client
const { UpgradeScripts } = require('./upgrade')
const { getFeedbackDefinitions } = require('./feedbacks')
const { Transitions } = require('./transitions')
const { MAX_CHANNEL, MAX_VALUE, TIMER_SLOW_DEFAULT, TIMER_FAST_DEFAULT } = require('./constants')
const { getActionDefinitions } = require('./actions')
const { getVariableDefinitions, getVariableValues } = require('./variables')
const {
	presetsConfigKey,
	parseLampPresets,
	serializeLampPresets,
	snapshotLampChannels,
	applyLampPresetSnapshot,
} = require('./presets')
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
		this.updateChannelVariables()
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

	updateChannelVariables() {
		if (!this.config) return
		this.setVariableValues(getVariableValues(this.config, this.data))
	}

	/**
	 * Snapshot all channels of a lamp into lamp_{L}_presets (one JSON blob in config).
	 * Persisted via saveConfig → included in Companion export/import.
	 */
	saveLampPreset(lampIndex, presetSlot) {
		const lampCount = this.config.lamp_number || 0
		if (lampIndex < 0 || lampIndex >= lampCount) {
			this.log('error', `Save lamp preset: invalid lamp index ${lampIndex}`)
			return false
		}

		const slot = Math.trunc(Number(presetSlot))
		if (!Number.isFinite(slot) || slot < 1) {
			this.log('error', `Save lamp preset: invalid preset slot ${presetSlot}`)
			return false
		}

		const key = presetsConfigKey(lampIndex)
		const store = parseLampPresets(this.config[key])
		store[String(slot)] = snapshotLampChannels(this.config, this.data, lampIndex)

		const newConfig = {
			...this.config,
			[key]: serializeLampPresets(store),
		}
		this.config = newConfig
		this.saveConfig(newConfig)
		this.log('info', `Saved lamp ${lampIndex + 1} preset ${slot}`)
		return true
	}

	/**
	 * Recall a preset slot for a lamp into the DMX buffer (optional fade).
	 */
	recallLampPreset(lampIndex, presetSlot, durationMs) {
		const lampCount = this.config.lamp_number || 0
		if (lampIndex < 0 || lampIndex >= lampCount) {
			this.log('error', `Recall lamp preset: invalid lamp index ${lampIndex}`)
			return false
		}

		const slot = Math.trunc(Number(presetSlot))
		const store = parseLampPresets(this.config[presetsConfigKey(lampIndex)])
		const snapshot = store[String(slot)]
		if (!snapshot) {
			this.log('warn', `Recall lamp preset: lamp ${lampIndex + 1} preset ${slot} is empty`)
			return false
		}

		const fade = Number(durationMs)
		const duration = isNaN(fade) || fade < 0 ? 0 : fade

		const applied = applyLampPresetSnapshot(this.config, this.data, lampIndex, snapshot, (channelIndex, value) => {
			this.transitions.run(channelIndex, value, duration)
		})

		if (applied === 0) {
			this.log('warn', `Recall lamp preset: lamp ${lampIndex + 1} preset ${slot} had no matching channels`)
			return false
		}

		this.log('info', `Recalled lamp ${lampIndex + 1} preset ${slot} (${applied} channels)`)
		return true
	}

	/**
	 * Set all configured channels of a lamp to 0 (optional fade).
	 */
	lampOff(lampIndex, durationMs) {
		const lampCount = this.config.lamp_number || 0
		if (lampIndex < 0 || lampIndex >= lampCount) {
			this.log('error', `Lamp off: invalid lamp index ${lampIndex}`)
			return false
		}

		const fade = Number(durationMs)
		const duration = isNaN(fade) || fade < 0 ? 0 : fade
		const channelCount = this.config[`lamp_${lampIndex}_channel_count`] || 0
		let applied = 0

		for (let c = 0; c < channelCount; c++) {
			const dmxAddress = Number(this.config[`lamp_${lampIndex}_channel_${c}_dmx`])
			if (!Number.isFinite(dmxAddress) || dmxAddress < 1 || dmxAddress > MAX_CHANNEL) {
				continue
			}
			this.transitions.run(dmxAddress - 1, 0, duration)
			applied++
		}

		if (applied === 0) {
			this.log('warn', `Lamp off: lamp ${lampIndex + 1} has no configured channels`)
			return false
		}

		this.log('info', `Lamp ${lampIndex + 1} off (${applied} channels)`)
		return true
	}

	#connectionChanged(prev, next) {
		if (!prev) return true
		return prev.host !== next.host || Number(prev.universe) !== Number(next.universe)
	}

	#timersChanged(prev, next) {
		if (!prev) return true
		return (
			Number(prev.timer_fast || TIMER_FAST_DEFAULT) !== Number(next.timer_fast || TIMER_FAST_DEFAULT) ||
			Number(prev.timer_slow || TIMER_SLOW_DEFAULT) !== Number(next.timer_slow || TIMER_SLOW_DEFAULT)
		)
	}

	async configUpdated(config) {
		const prev = this.config
		this.config = config

		// Rebuild actions/feedbacks/variables from current lamp config — no module restart needed
		this.setActionDefinitions(getActionDefinitions(this))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this))
		this.setVariableDefinitions(getVariableDefinitions(this.config))
		this.updateChannelVariables()

		const reconnect = this.#connectionChanged(prev, config)
		const retimers = this.#timersChanged(prev, config)

		if (retimers || !this.transitions) {
			if (this.transitions) this.transitions.stopAll()
			this.transitions = new Transitions(
				this.data,
				this.config.timer_fast || TIMER_FAST_DEFAULT,
				this.do_send.bind(this)
			)
		}

		if (reconnect) {
			if (this.client !== undefined) {
				this.client.close()
				delete this.client
			}

			if (this.config.host) {
				this.client = new artnetClient(this.config.host, 6454, this.config.universe || 0)
				this.updateStatus(InstanceStatus.Ok)
				this.do_send()
			} else {
				this.updateStatus(InstanceStatus.BadConfig, 'Missing host')
			}
		} else if (this.config.host) {
			this.updateStatus(InstanceStatus.Ok)
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Missing host')
		}

		if (retimers || !this.slow_send_timer) {
			if (this.slow_send_timer) {
				clearInterval(this.slow_send_timer)
				delete this.slow_send_timer
			}

			this.slow_send_timer = setInterval(() => {
				if (!this.transitions.isRunning()) {
					this.do_send()
				}
			}, this.config.timer_slow || TIMER_SLOW_DEFAULT)
		}
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
		this.updateChannelVariables()

		if (this.client) {
			this.client.send(this.data)
			this.checkFeedbacks('ChannelStateByName', 'ChannelState')
		}
	}

	getConfigFields() {
		return getConfigFields.call(this)
	}
}

runEntrypoint(ArtnetInstance, UpgradeScripts)
