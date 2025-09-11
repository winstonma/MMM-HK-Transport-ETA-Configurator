// Minimal main.js - most functionality moved to Svelte components and DataService

// Basic Log utility for compatibility
if (typeof Log === "undefined") {
	window.Log = {
		info: console.log.bind(console),
		log: console.log.bind(console),
		warn: console.warn.bind(console),
		error: console.error.bind(console),
		debug: console.debug.bind(console),
	};
}

// Minimal HKTransportETAProvider for DataService compatibility
window.HKTransportETAProvider = {
	providers: {},
	register(providerName, initializer) {
		this.providers[providerName] = initializer;
	},
	initialize(providerName, config) {
		return {
			config: {
				apiBase: "https://data.etabus.gov.hk/v1/transport/kmb",
				...config,
			},
			fetchData: async (url) => fetch(url),
		};
	},
};
