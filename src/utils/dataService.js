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

			const ctbProvider = window.HKTransportETAProvider.initialize('ctb', {});

			const routeStopsData =
				(await ctbProvider.fetchRouteStopsWithNames(route)) || [];

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

		try {
			// Initialize HKTransportETAProvider if not available
			if (!window.HKTransportETAProvider) {
				await this.initializeHKTransportETAProvider();
			}

			const kmbProvider = window.HKTransportETAProvider.initialize('kmb', {});

			// Check if kmbProvider was initialized successfully
			if (!kmbProvider) {
				throw new Error('Failed to initialize KMB provider');
			}

			// Fetch data using provider methods where available
			const [allRoutesData, stopData, allKmbRouteStopData] = await Promise.all([
				kmbProvider.fetchRoutes(), // Fetch all routes using provider method
				kmbProvider.fetchStopData(), // Fetch all stops using provider method
				kmbProvider.fetchRouteStop(), // Fetch all route-stops using provider method
			]);

			// Validate data structure
			if (
				!allRoutesData ||
				!Array.isArray(allRoutesData)
			) {
				throw new Error('Invalid KMB routes data structure');
			}
			if (!stopData || !Array.isArray(stopData)) {
				throw new Error('Invalid KMB stop data structure');
			}
			if (
				!allKmbRouteStopData ||
				!Array.isArray(allKmbRouteStopData)
			) {
				throw new Error('Invalid KMB route-stop data structure');
			}

			// Process routes data
			const kmbRoutesData = {};
			allRoutesData.forEach(route => {
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
			window.cachedStopData = stopData;

			const result = {
				kmbRoutesData,
				kmbRouteStopData: allKmbRouteStopData,
				stopData: stopData,
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

			const ctbProvider = window.HKTransportETAProvider.initialize('ctb', {});

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
							...config,
						},
						fetchData: async url => fetch(url),
						fetchRoutes: async () => {
							/* mock implementation */ return [];
						},
						fetchRouteStopsWithNames: async route => {
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
