import { writable, derived } from 'svelte/store';

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

// Derived stores for specific parts
export const provider = derived(
	config,
	$config => $config.transportETAProvider
);
export const station = derived(config, $config => $config.sta);

// Data stores
export const translations = writable({});
export const mtrLinesData = writable({});
export const kmbRoutesData = writable({});
export const kmbRouteStopData = writable([]);
export const mtrbusRoutesData = writable([]);
export const ctbRoutesData = writable([]);
export const ctbRouteStopsData = writable([]);
export const gmbRoutesData = writable({});
export const lrtStationsData = writable({});

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

// JSON output derived store
export const jsonOutput = derived(
	[config, mtrLinesData, kmbRouteStopData, lrtStationsData],
	([$config, $mtrLinesData, $kmbRouteStopData, $lrtStationsData]) => {
		if (!$config.sta) return '';

		const filteredConfig = {};
		for (const key in $config) {
			if (key === 'transportETAProvider') {
				filteredConfig[key] = $config[key];
			} else if (key === 'sta') {
				if (
					$config.transportETAProvider === 'mtr' &&
					$config.sta.includes('-')
				) {
					const [lineCode, stationCode] = $config.sta.split('-');
					const lineData = $mtrLinesData[lineCode];
					if (lineData) {
						const stationData = lineData.stations.find(
							s => s.code === stationCode
						);
						if (stationData) {
							filteredConfig[key] = stationData.en;
						} else {
							filteredConfig[key] = $config[key]; // Fallback to code if not found
						}
					} else {
						filteredConfig[key] = $config[key]; // Fallback to code if not found
					}
				} else if (
					$config.transportETAProvider === 'kmb' &&
					$config.sta.includes('-')
				) {
					let [route, serviceType, direction, stopCode] =
						$config.sta.split('-');

					// If stopCode is empty, try to find a default from kmbRouteStopData
					if (!stopCode) {
						const routeData = $kmbRouteStopData.find(
							item =>
								item.route === route &&
								item.serviceType === serviceType &&
								item.direction === direction
						);
						if (routeData && routeData.stops && routeData.stops.length > 0) {
							stopCode = routeData.stops[0].stop; // Default to the first stop's code
						}
					}

					// Now, find the English name for the (potentially defaulted) stopCode
					if (route && serviceType && direction && stopCode) {
						filteredConfig[key] = stopCode; // Only include the stopCode for KMB
					} else {
						filteredConfig[key] = $config[key]; // Fallback if not enough parts or no default found
					}
				} else if (
					$config.transportETAProvider === 'ctb' &&
					$config.sta.includes('-')
				) {
					// For CTB, the STA format is {route}-{direction}-{stop_id}
					const [route, direction, stopId] = $config.sta.split('-');
					if (route && direction && stopId) {
						filteredConfig[key] = stopId; // Show just the stop ID for CTB
					} else {
						filteredConfig[key] = $config[key]; // Fallback to raw value
					}
				} else if (
					$config.transportETAProvider === 'gmb' &&
					$config.sta.includes('-')
				) {
					// For GMB, the STA format is {area}-{line}-{stop_id}
					const [area, line, stopId] = $config.sta.split('-');
					if (area && line && stopId) {
						filteredConfig[key] = stopId; // Show just the stop ID for GMB
					} else {
						filteredConfig[key] = $config[key]; // Fallback to raw value
					}
				} else if ($config.transportETAProvider === 'lrt') {
					// For LRT, the STA format is just the station ID
					const stationId = $config.sta;
					if (stationId) {
						// Find the station across all zones
						let foundStation = null;
						for (const zoneData of Object.values($lrtStationsData)) {
							if (zoneData.stations) {
								foundStation = zoneData.stations.find(
									s => s.station_id.toString() === stationId
								);
								if (foundStation) break;
							}
						}
						if (foundStation) {
							filteredConfig[key] = foundStation.eng_name; // Use the English name
						} else {
							filteredConfig[key] = stationId; // Fallback to station ID
						}
					} else {
						filteredConfig[key] = $config[key]; // Fallback to raw value
					}
				} else {
					filteredConfig[key] = $config[key];
				}
			} else if (
				Object.prototype.hasOwnProperty.call(defaultConfig, key) &&
				$config[key] !== defaultConfig[key]
			) {
				filteredConfig[key] = $config[key];
			}
		}

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
