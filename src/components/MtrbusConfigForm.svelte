<script>
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let config;
	export let translations = {};
	export let mtrbusRoutesData = [];

	let selectedRoute = '';
	let selectedLineIndex = '';
	let selectedStopRefId = '';
	let stops = []; // Declare stops variable

	$: uniqueRoutes = Array.isArray(mtrbusRoutesData)
		? mtrbusRoutesData
				.map(route => route.route_number)
				.sort((a, b) =>
					a.toString().localeCompare(b.toString(), undefined, { numeric: true })
				)
		: [];

	$: selectedRouteObject = Array.isArray(mtrbusRoutesData)
		? mtrbusRoutesData.find(route => route.route_number === selectedRoute)
		: null;

	$: lines =
		selectedRouteObject && selectedRouteObject.lines
			? selectedRouteObject.lines
			: [];

	// Handle line selection changes
	$: {
		// When lines change and we don't have a selected line but we have lines, auto-select first
		if (lines.length > 0 && selectedLineIndex === '' && selectedRoute) {
			selectedLineIndex = '0';
		}

		// When lines change and our selected line is no longer valid, reset selection
		if (
			lines.length > 0 &&
			selectedLineIndex !== '' &&
			!lines[parseInt(selectedLineIndex)]
		) {
			selectedLineIndex = '0';
		}

		// When no lines available, clear selection
		if (lines.length === 0) {
			selectedLineIndex = '';
		}
	}

	// Handle stops based on line selection
	$: {
		// Update stops when line selection changes
		if (selectedLineIndex !== '' && lines[parseInt(selectedLineIndex)]) {
			stops = lines[parseInt(selectedLineIndex)].stops || [];
		} else {
			stops = [];
		}

		// Auto-select first stop when stops become available and no stop is currently selected
		if (stops.length > 0 && selectedStopRefId === '') {
			selectedStopRefId = stops[0].ref_ID;
		}

		// Update selectedStopRefId when the current selection becomes invalid
		const currentStopIsValid =
			selectedStopRefId && stops.some(s => s.ref_ID === selectedStopRefId);
		if (stops.length > 0 && selectedStopRefId && !currentStopIsValid) {
			selectedStopRefId = stops[0].ref_ID; // Select the first stop if current selection is invalid
		} else if (stops.length === 0) {
			selectedStopRefId = ''; // No stops available
		}
	}

	// Initialize from existing config
	onMount(() => {
		if (config.sta && Array.isArray(mtrbusRoutesData)) {
			const staParts = config.sta.split('-');
			if (staParts.length === 2) {
				// e.g., "K51-U010"
				const [routeNumber, stopRefId] = staParts;
				selectedRoute = routeNumber;
				selectedStopRefId = stopRefId;

				// Find the corresponding line for the stopRefId
				const route = mtrbusRoutesData.find(
					r => r.route_number === routeNumber
				);
				if (route && route.lines) {
					for (let i = 0; i < route.lines.length; i++) {
						const line = route.lines[i];
						if (line.stops.some(stop => stop.ref_ID === stopRefId)) {
							selectedLineIndex = i.toString();
							break;
						}
					}
				}
			} else if (staParts.length === 1) {
				// e.g., "K51" (only route selected)
				selectedRoute = staParts[0];
			}
		}
	});

	// Dispatch configChange when selectedRoute, selectedLineIndex, or selectedStopRefId changes
	$: {
		if (selectedRoute && selectedLineIndex !== '' && selectedStopRefId) {
			const newSta = selectedStopRefId; // The ref_ID is the STA for MTR Bus

			if (config.sta !== newSta) {
				dispatch('configChange', { sta: newSta });
			}
		}
	}
</script>

<div class="space-y-4">
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="mtrbusRouteSelect" class="w-full text-left">
			{translations.labelBusRoute || 'Bus Route:'}
		</label>
		<select
			id="mtrbusRouteSelect"
			class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
			bind:value={selectedRoute}
		>
			<option value="">-- Select Route --</option>
			{#each uniqueRoutes as routeNumber}
				<option value={routeNumber}>{routeNumber}</option>
			{/each}
		</select>
	</div>

	<!-- MTR Bus Direction Selection -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="mtrbusDirection" class="w-full text-left">
			{translations.labelDirection || 'Direction:'}
		</label>
		<select
			id="mtrbusDirection"
			class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
			on:change={e => (selectedLineIndex = e.target.value)}
			disabled={!selectedRoute}
		>
			{#each lines as line, index}
				<option
					value={index.toString()}
					selected={index.toString() === selectedLineIndex}
					>{line.description_en}</option
				>
			{/each}
			{#if lines.length === 0}
				<option value="" disabled selected={selectedLineIndex === ''}
					>{!selectedRoute
						? 'Select a route first'
						: 'No directions available'}</option
				>
			{/if}
		</select>
	</div>

	<!-- MTR Bus Stop Selection -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="mtrbusStop" class="w-full text-left">
			{translations.labelStop || 'Stop:'}
		</label>
		<select
			id="mtrbusStop"
			class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
			bind:value={selectedStopRefId}
			disabled={!selectedRoute || selectedLineIndex === ''}
		>
			{#each stops as stop}
				<option value={stop.ref_ID} title={stop.name_en}>{stop.name_en}</option>
			{:else}
				<option value="" disabled>No stops available</option>
			{/each}
		</select>
	</div>
</div>
