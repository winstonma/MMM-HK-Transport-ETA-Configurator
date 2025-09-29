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
			labelLrtStation: 'LRT Station:',
			labelSta: 'Station/Stop ID:',
			labelKmbRoute: 'KMB Route:',
			labelKmbDirection: 'KMB Direction:',
			labelKmbStop: 'KMB Stop:',
			labelArea: 'Area:',
			labelGmbLine: 'Line:',
			labelGmbStopId: 'GMB Stop ID:',
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
			if (!allRoutesData || !Array.isArray(allRoutesData)) {
				throw new Error('Invalid KMB routes data structure');
			}
			if (!stopData || !Array.isArray(stopData)) {
				throw new Error('Invalid KMB stop data structure');
			}
			if (!allKmbRouteStopData || !Array.isArray(allKmbRouteStopData)) {
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

	async loadGmbData() {
		const cacheKey = 'gmb-data';
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			// Initialize HKTransportETAProvider if not available
			if (!window.HKTransportETAProvider) {
				await this.initializeHKTransportETAProvider();
			}

			const gmbProvider = window.HKTransportETAProvider.initialize('gmb', {});

			// GMB doesn't have a direct route fetching method in the provider, so we'll return an empty object for now
			// The actual route data will be fetched when needed based on area from the API
			const result = {
				gmbRoutesData: {},
			};

			this.cache.set(cacheKey, result);
			return result;
		} catch (error) {
			console.error('Error fetching GMB data:', error);
			throw new Error(`Failed to load GMB data: ${error.message}`);
		}
	}

	// Load GMB routes by area
	async loadGmbRoutesByArea(area) {
		try {
			let apiUrl = '';
			if (area === 'NT') {
				apiUrl = 'https://data.etagmb.gov.hk/route/NT';
			} else if (area === 'KLN') {
				apiUrl = 'https://data.etagmb.gov.hk/route/KLN';
			} else if (area === 'HK') {
				apiUrl = 'https://data.etagmb.gov.hk/route/HKI'; // Hong Kong Island uses HKI code
			} else {
				throw new Error(`Invalid area: ${area}`);
			}

			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch GMB routes for area ${area}: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();

			// The API returns routes in data.routes as an array of strings
			if (data && data.data && Array.isArray(data.data.routes)) {
				return data.data.routes;
			} else {
				console.warn(`Unexpected API response format for area ${area}`, data);
				// Return an empty array if the expected format is not found
				return [];
			}
		} catch (error) {
			console.error(`Error fetching GMB routes for area ${area}:`, error);
			throw new Error(
				`Failed to load GMB routes for area ${area}: ${error.message}`
			);
		}
	}

	// Load GMB route details by area and route code
	async loadGmbRouteDetails(area, routeCode) {
		try {
			let regionCode = area;
			// Convert HK to HKI for the API
			if (area === 'HK') {
				regionCode = 'HKI';
			}

			const apiUrl = `https://data.etagmb.gov.hk/route/${regionCode}/${routeCode}`;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch GMB route details for route ${routeCode} in area ${area}: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();

			// The API should return route details with directions and stops
			if (data && data.data && Array.isArray(data.data)) {
				return data.data; // This should contain route information including directions and stops
			} else {
				console.warn(
					`Unexpected API response format for route ${routeCode} in area ${area}`,
					data
				);
				return [];
			}
		} catch (error) {
			console.error(
				`Error fetching GMB route details for route ${routeCode} in area ${area}:`,
				error
			);
			throw new Error(
				`Failed to load GMB route details for route ${routeCode} in area ${area}: ${error.message}`
			);
		}
	}

	// Load LRT station data
	async loadLrtStationsData() {
		const cacheKey = 'lrt-stations';
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

			const response = await fetch(`${baseUrl}external/data/station-lrt.json`);
			if (response.ok) {
				const lrtStationsData = await response.json();

				// Transform the data to match the expected format (grouped by zone)
				const transformedData = {};
				lrtStationsData.forEach(zoneObj => {
					const zoneCode = zoneObj.zone;
					transformedData[zoneCode] = {
						zone: zoneCode,
						stations: zoneObj.stations,
					};
				});

				this.cache.set(cacheKey, transformedData);
				return transformedData;
			}
		} catch (error) {
			console.error('Error fetching LRT stations:', error);
		}

		return {};
	}

	// Get GMB route ID by area and route code
	async getGmbRouteId(area, routeCode) {
		try {
			let regionCode = area;
			// Convert HK to HKI for the API
			if (area === 'HK') {
				regionCode = 'HKI';
			}

			const apiUrl = `https://data.etagmb.gov.hk/route/${regionCode}/${routeCode}`;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch GMB route ID for route ${routeCode} in area ${area}: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();

			// The API returns route information in data[0] with route_id field
			if (
				data &&
				data.data &&
				Array.isArray(data.data) &&
				data.data.length > 0
			) {
				return data.data[0].route_id; // Return the route ID
			} else {
				throw new Error(
					`Route ID not found for route ${routeCode} in area ${area}`
				);
			}
		} catch (error) {
			console.error(
				`Error fetching GMB route ID for route ${routeCode} in area ${area}:`,
				error
			);
			throw new Error(
				`Failed to get GMB route ID for route ${routeCode} in area ${area}: ${error.message}`
			);
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
