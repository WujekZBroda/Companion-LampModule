module.exports = {
	MAX_UNIVERSE: (1 << 15) - 1, // 15bit int
	MAX_CHANNEL: 512,
	MAX_VALUE: 255,

	TIMER_SLOW_DEFAULT: 1000, // 1hz
	TIMER_FAST_DEFAULT: 40, // 25hz

	/** Hard caps for pre-generated config fields (Companion shows/hides via isVisible). */
	MAX_LAMPS: 32,
	MAX_CHANNELS_PER_LAMP: 8,
}
