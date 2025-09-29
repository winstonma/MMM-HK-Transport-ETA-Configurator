<script>
	import BaseConfigForm from './shared/BaseConfigForm.svelte';
	import { createOption } from '../utils/configHelpers.js';

	export let config;
	export let lrtStationsData = {};
	export let translations;

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

	// Field configuration
	$: fields = [
		{
			id: 'station',
			labelKey: 'labelLrtStation',
			label: 'LRT Station:',
			placeholder: '-- Select Station --',
			options: getAllStations(lrtStationsData).map(station =>
				createOption(station.station_id.toString(), station.eng_name)
			),
		},
	];

	function initializeFromConfig(config) {
		if (config.sta && !config.sta.includes('-')) {
			return { station: config.sta };
		}

		// Auto-select first station if available
		const stations = getAllStations(lrtStationsData);
		return {
			station: stations.length > 0 ? stations[0].station_id.toString() : '',
		};
	}

	function buildConfigValue(selections) {
		return selections.station || null;
	}
</script>

<BaseConfigForm
	{config}
	{translations}
	{fields}
	{initializeFromConfig}
	{buildConfigValue}
	on:configChange
/>
