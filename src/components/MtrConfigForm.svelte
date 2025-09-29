<script>
	import BaseConfigForm from './shared/BaseConfigForm.svelte';
	import {
		createOption,
		parseStationId,
		buildStationId,
		findValidSelection,
	} from '../utils/configHelpers.js';

	export let config;
	export let mtrLinesData;
	export let translations;

	// Field configuration
	$: fields = [
		{
			id: 'line',
			labelKey: 'labelMtrLine',
			label: 'MTR Line:',
			placeholder: '-- Select Line --',
			options: Object.keys(mtrLinesData || {}).map(lineCode =>
				createOption(lineCode, mtrLinesData[lineCode]?.en || lineCode)
			),
		},
		{
			id: 'station',
			labelKey: 'labelMtrStation',
			label: 'MTR Station:',
			placeholder: '-- Select Station --',
			disabled: selections => !selections.line,
			options: selections => {
				if (!selections.line || !mtrLinesData[selections.line]) return [];
				return (mtrLinesData[selections.line].stations || []).map(station =>
					createOption(station.code, station.en)
				);
			},
		},
	];

	function initializeFromConfig(config) {
		if (config.sta && config.sta.includes('-')) {
			const [line, station] = parseStationId(config.sta);
			return { line: line || '', station: station || '' };
		}

		// Auto-select first line if available
		const lines = Object.keys(mtrLinesData || {});
		const selectedLine = lines.length > 0 ? lines[0] : '';
		let selectedStation = '';

		// Auto-select first station if line is available
		if (selectedLine && mtrLinesData[selectedLine]?.stations?.length > 0) {
			selectedStation = mtrLinesData[selectedLine].stations[0].code;
		}

		return {
			line: selectedLine,
			station: selectedStation,
		};
	}

	function onSelectionChange(selections, changedField) {
		// Reset station when line changes
		if (changedField === 'line') {
			selections.station = '';

			// Auto-select first station if available
			if (
				selections.line &&
				mtrLinesData[selections.line]?.stations?.length > 0
			) {
				selections.station = mtrLinesData[selections.line].stations[0].code;
			}
		}
		return selections;
	}

	function buildConfigValue(selections) {
		if (selections.line && selections.station) {
			return buildStationId([selections.line, selections.station]);
		}
		return null;
	}
</script>

<BaseConfigForm
	{config}
	{translations}
	{fields}
	{initializeFromConfig}
	{onSelectionChange}
	{buildConfigValue}
	on:configChange
/>
