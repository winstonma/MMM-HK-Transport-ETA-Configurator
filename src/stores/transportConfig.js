import { writable, derived } from 'svelte/store';
import { dataLoader } from '../utils/dataLoader.js';
import { dataService } from '../utils/dataService.js';

// Default configuration
const defaultConfig = {
	transportETAProvider: 'mtr',
	sta: 'HOK',
	reloadInterval: 60000,
	updateInterval: 5000,
	animationSpeed: 2500,
	initialLoadDelay: 0,
	colored: false,
	showHeader: false,
};

// Main config store
export const config = writable({ ...defaultConfig });

// UI state
export const loading = writable(false);
export const error = writable('');
export const showAdvanced = writable(false);

// Toast notifications
export const toast = writable({
	show: false,
	message: '',
	type: 'info',
});

// Data loaders for each provider
const mtrLoader = dataLoader.createProviderDataLoader('mtr');
const kmbLoader = dataLoader.createProviderDataLoader('kmb');
const ctbLoader = dataLoader.createProviderDataLoader('ctb');
const ctbRouteStopsLoader =
	dataLoader.createProviderDataLoader('ctb-route-stops');
const mtrbusLoader = dataLoader.createProviderDataLoader('mtrbus');
const gmbLoader = dataLoader.createProviderDataLoader('gmb');
const lrtLoader = dataLoader.createProviderDataLoader('lrt');

// Reactive data stores
export const mtrLinesData = derived(
	mtrLoader.store,
	$store => $store.data || {}
);
export const kmbData = derived(
	kmbLoader.store,
	$store => $store.data || { kmbRoutesData: {}, kmbRouteStopData: [] }
);
export const ctbData = derived(
	ctbLoader.store,
	$store => $store.data || { ctbRoutesData: [] }
);
export const ctbRouteStopsData = derived(
	ctbRouteStopsLoader.store,
	$store => $store.data || []
);
export const mtrbusRoutesData = derived(
	mtrbusLoader.store,
	$store => $store.data || []
);
export const gmbRoutesData = derived(
	gmbLoader.store,
	$store => $store.data || {}
);
export const lrtStationsData = derived(
	lrtLoader.store,
	$store => $store.data || {}
);

// Derived stores for backward compatibility
export const kmbRoutesData = derived(kmbData, $data => $data.kmbRoutesData);
export const kmbRouteStopData = derived(
	kmbData,
	$data => $data.kmbRouteStopData
);
export const ctbRoutesData = derived(ctbData, $data => $data.ctbRoutesData);

// Translations store
export const translations = writable({});

// Provider-specific loading states
export const providerLoading = derived(
	[
		mtrLoader.store,
		kmbLoader.store,
		ctbLoader.store,
		mtrbusLoader.store,
		gmbLoader.store,
		lrtLoader.store,
	],
	([mtr, kmb, ctb, mtrbus, gmb, lrt]) => ({
		mtr: mtr.loading,
		kmb: kmb.loading,
		ctb: ctb.loading,
		mtrbus: mtrbus.loading,
		gmb: gmb.loading,
		lrt: lrt.loading,
	})
);

// Helper functions
export function showToast(message, type = 'info', duration = 3000) {
	toast.set({ show: true, message, type });
	if (duration > 0) {
		setTimeout(() => {
			toast.update(t => ({ ...t, show: false }));
		}, duration);
	}
}

export function updateConfig(updates) {
	config.update(current => ({ ...current, ...updates }));
}

export function resetConfig() {
	config.set({ ...defaultConfig });
}

// Data loading functions
export async function loadTranslations(lang = 'en') {
	try {
		const translationsData = await dataService.loadTranslations(lang);
		translations.set(translationsData);
		return translationsData;
	} catch (err) {
		error.set(`Failed to load translations: ${err.message}`);
		throw err;
	}
}

export async function loadProviderData(provider) {
	try {
		switch (provider) {
			case 'mtr':
				return await mtrLoader.load();
			case 'kmb':
				return await kmbLoader.load();
			case 'ctb':
				return await ctbLoader.load();
			case 'mtrbus':
				return await mtrbusLoader.load();
			case 'gmb':
				return await gmbLoader.load();
			case 'lrt':
				return await lrtLoader.load();
			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	} catch (err) {
		error.set(`Failed to load ${provider} data: ${err.message}`);
		throw err;
	}
}

export async function loadCtbRouteStops(route) {
	try {
		return await ctbRouteStopsLoader.load(route);
	} catch (err) {
		error.set(`Failed to load CTB route stops: ${err.message}`);
		throw err;
	}
}

// JSON output derived store (simplified)
export const jsonOutput = derived(
	[config, mtrLinesData, kmbRouteStopData, lrtStationsData],
	([$config, $mtrLinesData, $kmbRouteStopData, $lrtStationsData]) => {
		if (!$config.sta) return '';

		const filteredConfig = {
			transportETAProvider: $config.transportETAProvider,
		};

		// Process sta field based on provider
		if ($config.transportETAProvider === 'mtr' && $config.sta.includes('-')) {
			const [lineCode, stationCode] = $config.sta.split('-');
			const lineData = $mtrLinesData[lineCode];
			const stationData = lineData?.stations?.find(s => s.code === stationCode);
			filteredConfig.sta = stationData?.en || $config.sta;
		} else if ($config.transportETAProvider === 'lrt') {
			const stationId = $config.sta;
			let foundStation = null;
			for (const zoneData of Object.values($lrtStationsData)) {
				if (zoneData.stations) {
					foundStation = zoneData.stations.find(
						s => s.station_id.toString() === stationId
					);
					if (foundStation) break;
				}
			}
			filteredConfig.sta = foundStation?.eng_name || stationId;
		} else {
			// For other providers, extract the relevant part
			const parts = $config.sta.split('-');
			filteredConfig.sta = parts[parts.length - 1] || $config.sta;
		}

		// Add non-default config values
		Object.keys(defaultConfig).forEach(key => {
			if (
				key !== 'transportETAProvider' &&
				key !== 'sta' &&
				$config[key] !== defaultConfig[key]
			) {
				filteredConfig[key] = $config[key];
			}
		});

		return JSON.stringify(
			{
				module: 'MMM-HK-Transport-ETA',
				position: 'top_right',
				config: filteredConfig,
			},
			null,
			4
		);
	}
);
