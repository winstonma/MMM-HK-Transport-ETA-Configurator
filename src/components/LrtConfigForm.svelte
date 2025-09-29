<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import FormField from './shared/FormField.svelte';
	import { createOption } from '../utils/configHelpers.js';

	const dispatch = createEventDispatcher();

	export let config;
	export let lrtStationsData = {};
	export let translations;

	let selectedStation = '';

	// Flatten all stations from all zones
	function getAllStations(lrtData) {
		const stations = [];
		Object.values(lrtData).forEach(zoneData => {
			if (zoneData.stations) {
				stations.push(...zoneData.stations);
			}
		});
		return stations;
	}

	// Computed stations array
	$: stations = getAllStations(lrtStationsData).map(station =>
		createOption(station.station_id.toString(), station.eng_name)
	);

	// Update config when station selection changes
	$: if (selectedStation) {
		const newSta = selectedStation; // For LRT, the station_id is the sta value
		if (config.sta !== newSta) {
			dispatch('configChange', { sta: newSta });
		}
	}

	// Initialize from existing config
	onMount(() => {
		if (config.sta && !config.sta.includes('-')) {
			// If sta is not in zone-station format, it should be a station ID
			selectedStation = config.sta;
		} else if (stations.length > 0) {
			// Auto select the first station if none is selected
			selectedStation = stations[0].value;
		}
	});

	// Auto-select first station if none selected and stations are available
	$: if (stations.length > 0 && !selectedStation) {
		selectedStation = stations[0].value;
	}
</script>

<div class="space-y-4">
	<!-- LRT Station Selection -->
	<FormField
		id="lrtStation"
		label={translations.labelLrtStation || 'LRT Station:'}
		value={selectedStation}
		options={stations}
		placeholder="-- Select Station --"
		on:change={e => (selectedStation = e.detail)}
	/>
</div>
