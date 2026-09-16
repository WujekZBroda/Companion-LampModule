const { MAX_VALUE } = require('./constants')

function clampDmx(value) {
	const n = Number(value)
	if (!Number.isFinite(n)) return 0
	return Math.min(MAX_VALUE, Math.max(0, Math.round(n)))
}

class Transitions {
	transitions = new Map()

	tickInterval = undefined

	constructor(data, tickMs, sendFcn) {
		this.data = data
		this.tickMs = tickMs
		this.sendFcn = sendFcn
	}

	isRunning() {
		return this.transitions.size > 0
	}

	stopAll() {
		this.transitions.clear()

		if (this.tickInterval) {
			clearInterval(this.tickInterval)
			delete this.tickInterval
		}
	}

	runTick() {
		const completedChannels = []
		for (const [channel, info] of this.transitions.entries()) {
			const newValue = info.steps.shift()
			if (newValue !== undefined) {
				this.data[channel] = clampDmx(newValue)
			}
			if (info.steps.length === 0) {
				completedChannels.push(channel)
			}
		}

		// Remove any completed transitions
		for (const path of completedChannels) {
			this.transitions.delete(path)
		}
		// If nothing is left, stop the timer
		if (this.transitions.size === 0) {
			this.stopAll()
		}

		this.sendFcn()
	}

	run(channel, to, duration) {
		if (!Number.isInteger(channel) || channel < 0 || channel >= this.data.length) {
			return
		}

		const from = this.data[channel]
		const target = clampDmx(to)
		const stepCount = Math.ceil(Number(duration) / this.tickMs)

		if (!Number.isFinite(stepCount) || stepCount <= 1) {
			this.transitions.set(channel, {
				steps: [target],
			})
		} else {
			const diff = target - from
			const steps = []
			const easing = (v) => v // aka Easing.Linear.None // TODO - dynamic
			for (let i = 1; i <= stepCount; i++) {
				const fraction = easing(i / stepCount)
				steps.push(clampDmx(from + diff * fraction))
			}

			this.transitions.set(channel, {
				steps,
			})
		}

		if (!this.tickInterval) {
			// Start the tick if not already running
			this.tickInterval = setInterval(() => this.runTick(), this.tickMs)
		}
	}
}

module.exports = {
	Transitions,
}
