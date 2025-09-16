// Minimal main.js - most functionality moved to Svelte components and DataService

// Basic Log utility for compatibility
if (typeof Log === 'undefined') {
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
		const provider = this.providers[providerName];
		if (!provider) {
			Log.error(`Provider ${providerName} not registered.`);
			return null;
		}

		// Merge default config with provided config
		const mergedConfig = { ...provider.defaults, ...config };

		const providerInstance = {};
		providerInstance.config = mergedConfig;
		providerInstance.fetchData = async url => {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		};

		// Bind all original provider methods to this instance
		Object.keys(provider)
			.filter(key => typeof provider[key] === 'function')
			.forEach(key => {
				providerInstance[key] = provider[key].bind(providerInstance);
			});

		return providerInstance;
	},
};
