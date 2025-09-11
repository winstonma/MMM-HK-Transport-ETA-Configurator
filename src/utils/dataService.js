// Data service for loading transport data
export class DataService {
	constructor() {
		this.cache = new Map();
	}

	async loadTranslations(lang = "en") {
		const cacheKey = `translations-${lang}`;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			const response = await fetch(`/${lang}.json`);
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
			pageTitle: "MMM-HK-Transport-ETA Configuration",
			pageDescription:
				"To configure the module, modify the settings using the form, and then copy the updated JSON back into your <code>config.json</code> file in the module directory.",
			labelTransportETAProvider: "Transport ETA Provider:",
			labelMtrLine: "MTR Line:",
			labelMtrStation: "MTR Station:",
			labelSta: "Station/Stop ID:",
			labelKmbRoute: "KMB Route:",
			labelKmbDirection: "KMB Direction:",
			labelKmbStop: "KMB Stop:",
			labelReloadInterval: "Reload Interval (minutes):",
			labelUpdateInterval: "Update Interval (seconds):",
			labelAnimationSpeed: "Animation Speed (milliseconds):",
			labelInitialLoadDelay: "Initial Load Delay (milliseconds):",
			labelJsonOutput: "Copy updated config.json content from here:",
			advancedSettingsText: "Advanced Settings",
			errorFetchingKmbRoutes: "Error fetching KMB routes",
		};

		this.cache.set(cacheKey, fallbackTranslations);
		return fallbackTranslations;
	}

	async loadMtrLinesData() {
		const cacheKey = "mtr-lines";
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			const response = await fetch("/external/mtr-lines.json");
			if (response.ok) {
				const mtrLinesData = await response.json();
				this.cache.set(cacheKey, mtrLinesData);
				return mtrLinesData;
			}
		} catch (error) {
			console.error("Error fetching MTR lines:", error);
		}

		return {};
	}

	async loadKmbData() {
		const cacheKey = "kmb-data";
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey);
		}

		try {
			// Initialize HKTransportETAProvider if not available
			if (!window.HKTransportETAProvider) {
				await this.initializeHKTransportETAProvider();
			}

			const kmbProvider = window.HKTransportETAProvider.initialize(
				"kmb",
				{
					apiBase: "https://data.etabus.gov.hk/v1/transport/kmb",
				},
			);

			const [allRoutesResponse, stopResponse, allRouteStopResponse] =
				await Promise.all([
					kmbProvider.fetchData(
						`${kmbProvider.config.apiBase}/route/`,
					),
					kmbProvider.fetchData(
						`${kmbProvider.config.apiBase}/stop/`,
					),
					kmbProvider.fetchData(
						`${kmbProvider.config.apiBase}/route-stop/`,
					),
				]);

			if (
				!allRoutesResponse.ok ||
				!stopResponse.ok ||
				!allRouteStopResponse.ok
			) {
				throw new Error("Failed to fetch KMB data from API");
			}

			const allRoutesData = await allRoutesResponse.json();
			const stopData = await stopResponse.json();
			const allKmbRouteStopData = await allRouteStopResponse.json();

			// Process routes data
			const kmbRoutesData = {};
			allRoutesData.data.forEach((route) => {
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
			console.error("Error fetching KMB data:", error);
			throw new Error(`Failed to load KMB data: ${error.message}`);
		}
	}

	async initializeHKTransportETAProvider() {
		// Load the provider scripts if not already loaded
		const scripts = ["/scripts/main.js", "/scripts/providers/kmb.js"];

		for (const scriptSrc of scripts) {
			if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
				await this.loadScript(scriptSrc);
			}
		}

		// Fallback mock if providers don't load
		if (!window.HKTransportETAProvider) {
			window.HKTransportETAProvider = {
				initialize: (provider, config) => ({
					config: {
						apiBase: "https://data.etabus.gov.hk/v1/transport/kmb",
						...config,
					},
					fetchData: async (url) => fetch(url),
				}),
			};
		}
	}

	loadScript(src) {
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.type = "module";
			script.src = src;
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	clearCache() {
		this.cache.clear();
	}
}

// Export singleton instance
export const dataService = new DataService();
