// Data service for loading transport data
export class DataService {
	constructor() {
		this.cache = new Map();
	}

	async loadTranslations(lang = 'en') {
		const cacheKey = `translations-${lang}`;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			const response = await fetch(`${import.meta.env.BASE_URL}${lang}.json`);
			if (response.ok) {
				const translations = await response.json();
				this.cache.set(cacheKey, translations);
				return translations;
			}
		} catch (error) {
			console.error(`Error loading translations for ${lang}:`, error);
		}

		// Fallback translations
		const fallbackTranslations = {
			pageTitle: 'MMM-HK-Transport-ETA Configuration',
			pageDescription:
				'To configure the module, modify the settings using the form, and then copy the updated JSON back into your <code>config.json</code> file in the module directory.',
			labelTransportETAProvider: 'Transport ETA Provider:',
			labelMtrLine: 'MTR Line:',
			labelMtrStation: 'MTR Station:',
			labelSta: 'Station/Stop ID:',
			labelKmbRoute: 'KMB Route:',
			labelKmbDirection: 'KMB Direction:',
			labelKmbStop: 'KMB Stop:',
			labelReloadInterval: 'Reload Interval (minutes):',
			labelUpdateInterval: 'Update Interval (seconds):',
			labelAnimationSpeed: 'Animation Speed (milliseconds):',
			labelInitialLoadDelay: 'Initial Load Delay (milliseconds):',
			labelJsonOutput: 'Copy updated config.json content from here:',
			advancedSettingsText: 'Advanced Settings',
			errorFetchingKmbRoutes: 'Error fetching KMB routes',
		};

		this.cache.set(cacheKey, fallbackTranslations);
		return fallbackTranslations;
	}

	async loadMtrLinesData() {
		const cacheKey = 'mtr-lines';
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			let baseUrl =
				typeof import.meta !== 'undefined' &&
				import.meta.env &&
				import.meta.env.BASE_URL
					? import.meta.env.BASE_URL
					: '/';

			// Fix for build-time URL issues
			if (baseUrl.includes('MMM-HK-Transport-ETA-Configurator')) {
				baseUrl = '/';
			}

			const response = await fetch(`${baseUrl}external/data/mtr-lines.json`);
			if (response.ok) {
				const mtrLinesData = await response.json();
				this.cache.set(cacheKey, mtrLinesData);
				return mtrLinesData;
			}
		} catch (error) {
			console.error('Error fetching MTR lines:', error);
		}

		return {};
	}

	async loadMtrbusRoutesData() {
		const cacheKey = 'mtrbus-routes';
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			// Handle both browser and Node.js environments
			let baseUrl =
				typeof import.meta !== 'undefined' &&
				import.meta.env &&
				import.meta.env.BASE_URL
					? import.meta.env.BASE_URL
					: '/';

			// Fix for build-time URL issues
			if (baseUrl.includes('MMM-HK-Transport-ETA-Configurator')) {
				baseUrl = '/';
			}

			const response = await fetch(`${baseUrl}external/data/routes-mtr.json`);
			if (response.ok) {
				const mtrbusRoutesData = await response.json();
				this.cache.set(cacheKey, mtrbusRoutesData);
				return mtrbusRoutesData;
			}
		} catch (error) {
			console.error('Error fetching MTR Bus routes:', error);
		}

		return [];
	}

	async loadCtbRouteStopsData(route) {
		const cacheKey = `ctb-route-stops-${route}`;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			// Initialize HKTransportETAProvider if not available
			if (!window.HKTransportETAProvider) {
				await this.initializeHKTransportETAProvider();
			}

			const ctbProvider = window.HKTransportETAProvider.initialize('ctb', {
				apiBase: 'https://rt.data.gov.hk/v2/transport/citybus',
			});

			const routeStopsData = (await ctbProvider.fetchRouteStops(route)) || [];

			this.cache.set(cacheKey, routeStopsData);
			return routeStopsData;
		} catch (error) {
			console.error(
				`Error fetching CTB route stops for route ${route}:`,
				error
			);
			throw new Error(`Failed to load CTB route stops data: ${error.message}`);
		}
	}

	async loadKmbData() {
		const cacheKey = 'kmb-data';
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		// Add retry logic
		const fetchWithRetry = async (fetchFn, retries = 3) => {
			for (let i = 0; i < retries; i++) {
				try {
					return await fetchFn();
				} catch (error) {
					const errorMessage = error.message || error.toString();
					console.warn(`KMB data fetch attempt ${i + 1} failed:`, errorMessage);
					if (i === retries - 1) throw error;
					// Wait before retry with exponential backoff
					await new Promise(resolve =>
						setTimeout(resolve, 1000 * Math.pow(2, i))
					);
				}
			}
		};

		try {
			// Initialize HKTransportETAProvider if not available
			if (!window.HKTransportETAProvider) {
				await this.initializeHKTransportETAProvider();
			}

			const kmbProvider = window.HKTransportETAProvider.initialize('kmb', {
				apiBase: 'https://data.etabus.gov.hk/v1/transport/kmb',
			});

			// Check if kmbProvider was initialized successfully
			if (!kmbProvider) {
				throw new Error('Failed to initialize KMB provider');
			}

			// Fetch data with retry logic
			const [allRoutesData, stopData, allKmbRouteStopData] = await Promise.all([
				fetchWithRetry(() =>
					kmbProvider.fetchData(`${kmbProvider.config.apiBase}/route/`)
				),
				fetchWithRetry(() =>
					kmbProvider.fetchData(`${kmbProvider.config.apiBase}/stop/`)
				),
				fetchWithRetry(() =>
					kmbProvider.fetchData(`${kmbProvider.config.apiBase}/route-stop/`)
				),
			]);

			// Log data structure for debugging
			console.log('KMB API Data:', {
				routes: { count: allRoutesData?.data?.length || 0 },
				stops: { count: stopData?.data?.length || 0 },
				routeStops: { count: allKmbRouteStopData?.data?.length || 0 },
			});

			// Validate data structure
			if (
				!allRoutesData ||
				!allRoutesData.data ||
				!Array.isArray(allRoutesData.data)
			) {
				throw new Error('Invalid KMB routes data structure');
			}
			if (!stopData || !stopData.data || !Array.isArray(stopData.data)) {
				throw new Error('Invalid KMB stop data structure');
			}
			if (
				!allKmbRouteStopData ||
				!allKmbRouteStopData.data ||
				!Array.isArray(allKmbRouteStopData.data)
			) {
				throw new Error('Invalid KMB route-stop data structure');
			}

			// Process routes data
			const kmbRoutesData = {};
			allRoutesData.data.forEach(route => {
				const routeNumber = route.route;
				if (!kmbRoutesData[routeNumber]) {
					kmbRoutesData[routeNumber] = [];
				}
				kmbRoutesData[routeNumber].push({
					route: route.route,
					bound: route.bound,
					service_type: route.service_type,
					orig_en: route.orig_en,
					dest_en: route.dest_en,
				});
			});

			// Cache stop data globally for components to use
			window.cachedStopData = stopData.data;

			const result = {
				kmbRoutesData,
				kmbRouteStopData: allKmbRouteStopData.data,
				stopData: stopData.data,
			};

			this.cache.set(cacheKey, result);
			return result;
		} catch (error) {
			const errorMessage = error.message || error.toString();
			console.error('Error fetching KMB data:', error);
			throw new Error(`Failed to load KMB data: ${errorMessage}`);
		}
	}

	async loadCtbData() {
		const cacheKey = 'ctb-data';
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			// Initialize HKTransportETAProvider if not available
			if (!window.HKTransportETAProvider) {
				await this.initializeHKTransportETAProvider();
			}

			const ctbProvider = window.HKTransportETAProvider.initialize('ctb', {
				apiBase: 'https://rt.data.gov.hk/v2/transport/citybus',
			});

			const ctbRoutesData = (await ctbProvider.fetchRoutes()) || [];

			const result = {
				ctbRoutesData,
			};

			this.cache.set(cacheKey, result);
			return result;
		} catch (error) {
			console.error('Error fetching CTB data:', error);
			throw new Error(`Failed to load CTB data: ${error.message}`);
		}
	}

	async initializeHKTransportETAProvider() {
		// Fallback mock if providers don't load
		if (!window.HKTransportETAProvider) {
			window.HKTransportETAProvider = {
				initialize: (provider, config) => {
					const mockProvider = {
						config: {
							apiBase: 'https://data.etabus.gov.hk/v1/transport/kmb',
							...config,
						},
						fetchData: async url => fetch(url),
						fetchRoutes: async () => {
							/* mock implementation */ return [];
						},
						fetchRouteStops: async route => {
							/* mock implementation */ return [];
						},
					};
					return mockProvider;
				},
			};
		}
	}

	clearCache() {
		this.cache.clear();
	}
}

// Export singleton instance
export const dataService = new DataService();
