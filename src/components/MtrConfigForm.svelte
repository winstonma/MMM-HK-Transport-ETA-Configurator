<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import FormField from './shared/FormField.svelte';
	import { createOption } from '../utils/configHelpers.js';

	const dispatch = createEventDispatcher();

	export let config;
	export let mtrLinesData;
	export let translations;

	let selectedLine = '';
	let selectedStation = '';

	// Computed lines array
	$: lines = Object.keys(mtrLinesData || {}).map(lineCode =>
		createOption(lineCode, mtrLinesData[lineCode]?.en || lineCode)
	);

	// Computed stations array
	$: stations =
		selectedLine && mtrLinesData[selectedLine]
			? (mtrLinesData[selectedLine].stations || []).map(station =>
					createOption(station.code, station.en)
				)
			: [];

	// Update config when selections change
	$: if (selectedLine && selectedStation) {
		const newSta = `${selectedLine}-${selectedStation}`;
		if (config.sta !== newSta) {
			dispatch('configChange', { sta: newSta });
		}
	}

	// Initialize from existing config
	onMount(() => {
		if (config.sta && config.sta.includes('-')) {
			const [line, station] = config.sta.split('-');
			selectedLine = line || '';
			selectedStation = station || '';
		} else if (lines.length > 0) {
			selectedLine = lines[0].value;
		}
	});

	// Auto-select first line if none selected and lines are available
	$: if (lines.length > 0 && !selectedLine) {
		selectedLine = lines[0].value;
	}

	// Auto-select first station when line changes
	$: if (selectedLine && stations.length > 0 && !selectedStation) {
		selectedStation = stations[0].value;
	}

	// Reset station when line changes
	$: if (selectedLine) {
		// Check if current station is valid for the new line
		const isValidStation = stations.some(s => s.value === selectedStation);
		if (!isValidStation && stations.length > 0) {
			selectedStation = stations[0].value;
		} else if (stations.length === 0) {
			selectedStation = '';
		}
	}
</script>

<div class="space-y-4">
	<!-- MTR Line Selection -->
	<FormField
		id="mtrLine"
		label={translations.labelMtrLine || 'MTR Line:'}
		value={selectedLine}
		options={lines}
		placeholder="-- Select Line --"
		on:change={e => (selectedLine = e.detail)}
	/>

	<!-- MTR Station Selection -->
	<FormField
		id="mtrStation"
		label={translations.labelMtrStation || 'MTR Station:'}
		value={selectedStation}
		options={stations}
		placeholder="-- Select Station --"
		disabled={!selectedLine}
		on:change={e => (selectedStation = e.detail)}
	/>
</div>
