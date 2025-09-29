<script>
	import { onMount } from 'svelte';
	import { dataService } from '../utils/dataService.js';

	// Props
	export let config;
	export let gmbRoutesData;
	export let translations;

	// Events
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	// Local state
	let areas = ['NT', 'HK', 'KLN']; // New Territories, Hong Kong Island, Kowloon
	let gmbLines = [];
	let gmbDirections = [];
	let gmbStops = [];
	let loadingLines = false;
	let loadingDirections = false;
	let selectedArea =
		config.sta && config.sta.includes('-') ? config.sta.split('-')[0] : ''; // Only set from config if it exists, otherwise empty
	let selectedLine = config.sta.split('-')[1] || '';
	let selectedDirection = '';
	let selectedStopId =
		config.sta && config.sta.includes('-')
			? config.sta.split('-')[2] || ''
			: ''; // The actual stop ID from the config

	// Cache route details to avoid redundant API calls
	let cachedRouteId = null;
	let cachedRouteDetails = null;

	// Reactive statement to handle stop ID changes
	$: if (selectedArea && selectedLine && selectedStopId) {
		const newSta = `${selectedArea}-${selectedLine}-${selectedStopId}`;
		dispatch('configChange', { sta: newSta });
	} else if (selectedArea || selectedLine || selectedStopId !== '') {
		// Only dispatch empty if we're in the middle of a selection process
		dispatch('configChange', { sta: '' });
	}

	// Initialize values when component mounts or config changes
	onMount(async () => {
		if (config.sta && config.sta.includes('-')) {
			const parts = config.sta.split('-');
			selectedArea = parts[0];
			selectedLine = parts[1] || '';

			// If more parts exist, extract stop ID
			if (parts.length > 2) {
				selectedStopId = parts[2];
			}

			// Load routes for the selected area
			await loadRoutesForArea(selectedArea);
		}
	});

	// Function to load routes based on selected area
	async function loadRoutesForArea(area) {
		if (!area) return;

		loadingLines = true;

		try {
			// Use the data service to load routes by area
			const routeNumbers = await dataService.loadGmbRoutesByArea(area);
			gmbLines = routeNumbers;
		} catch (error) {
			console.error('Error loading GMB routes:', error);
			// Fallback to any available route data in gmbRoutesData if API fails
			if (gmbRoutesData && Object.keys(gmbRoutesData).length > 0) {
				gmbLines = Object.keys(gmbRoutesData);
			} else {
				gmbLines = [];
			}
		} finally {
			loadingLines = false;
		}
	}

	// Function to load route directions based on selected area and line
	async function loadRouteDirections(area, routeCode) {
		if (!area || !routeCode) return;

		loadingDirections = true;

		try {
			// Use the data service to load route details
			const routeDetails = await dataService.loadGmbRouteDetails(
				area,
				routeCode
			);

			// Cache the route details and extract route ID
			cachedRouteDetails = routeDetails;
			if (Array.isArray(routeDetails) && routeDetails.length > 0) {
				const routeInfo = routeDetails[0];
				cachedRouteId = routeInfo.route_id; // Cache the route ID

				if (routeInfo && routeInfo.directions) {
					gmbDirections = routeInfo.directions;
				} else {
					// If directions are not in the expected format, create basic ones
					gmbDirections = [
						{
							route_seq: 1,
							dest_en: `${routeCode} - Outbound`,
							dest_tc: `${routeCode} - 去程`,
						},
						{
							route_seq: 2,
							dest_en: `${routeCode} - Inbound`,
							dest_tc: `${routeCode} - 返程`,
						},
					];
				}
			} else {
				gmbDirections = [];
				cachedRouteId = null;
			}
		} catch (error) {
			console.error('Error loading GMB route directions:', error);
			// Set default directions if API fails
			gmbDirections = [
				{
					route_seq: 1,
					dest_en: `${routeCode} - Outbound`,
					dest_tc: `${routeCode} - 去程`,
				},
				{
					route_seq: 2,
					dest_en: `${routeCode} - Inbound`,
					dest_tc: `${routeCode} - 返程`,
				},
			];
			cachedRouteId = null;
			cachedRouteDetails = null;
		} finally {
			loadingDirections = false;
		}
	}

	// Function to load stops for a specific route and direction
	async function loadRouteStops(directionSeq) {
		if (!directionSeq || !cachedRouteId) return;

		try {
			// Use the cached route ID instead of making another API call
			const apiUrl = `https://data.etagmb.gov.hk/route-stop/${cachedRouteId}/${directionSeq}`;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch GMB route stops: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();

			if (data && data.data && Array.isArray(data.data.route_stops)) {
				gmbStops = data.data.route_stops;
			} else {
				console.warn(`Unexpected API response format for route stops`, data);
				gmbStops = [];
			}
		} catch (error) {
			console.error('Error loading GMB route stops:', error);
			gmbStops = [];
		}
	}

	// Function to handle area change
	async function handleAreaChange(event) {
		selectedArea = event.target.value;
		selectedLine = '';
		selectedDirection = '';
		selectedStopId = '';
		gmbDirections = [];
		gmbStops = [];

		// Clear cached data when area changes
		cachedRouteId = null;
		cachedRouteDetails = null;

		// Load routes for the new area
		await loadRoutesForArea(selectedArea);

		// Only update configuration when all parts are selected
		if (selectedArea && selectedLine && selectedStopId) {
			const newSta = `${selectedArea}-${selectedLine}-${selectedStopId}`;
			dispatch('configChange', { sta: newSta });
		}
	}

	// Function to handle line change
	async function handleLineChange(event) {
		selectedLine = event.target.value;
		selectedDirection = ''; // Reset direction when route changes
		selectedStopId = '';
		gmbDirections = [];
		gmbStops = [];

		// Clear cached data when route changes
		cachedRouteId = null;
		cachedRouteDetails = null;

		// Load directions for the new line if area and line are selected
		if (selectedArea && selectedLine) {
			await loadRouteDirections(selectedArea, selectedLine);
		}

		// Only update configuration when all parts are selected
		if (selectedArea && selectedLine && selectedStopId) {
			const newSta = `${selectedArea}-${selectedLine}-${selectedStopId}`;
			dispatch('configChange', { sta: newSta });
		}
	}

	// Function to handle direction change
	async function handleDirectionChange(event) {
		// Convert the value to number since route_seq is numeric
		const newDirection = parseInt(event.target.value, 10);
		selectedDirection = newDirection;
		selectedStopId = ''; // Reset stop when direction changes
		gmbStops = [];

		// Load stops for the selected direction using cached route ID
		if (newDirection && cachedRouteId) {
			await loadRouteStops(newDirection);
		}

		// Only update configuration when all parts are selected
		if (selectedArea && selectedLine && selectedStopId) {
			const newSta = `${selectedArea}-${selectedLine}-${selectedStopId}`;
			dispatch('configChange', { sta: newSta });
		}
	}

	// Set area names for display
	const areaNames = {
		NT: 'New Territories',
		HK: 'Hong Kong Island',
		KLN: 'Kowloon',
	};
</script>

<div class="gmb-config-form space-y-4">
	<!-- Area Selection -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="gmb-area" class="w-full text-left">
			{translations.labelArea || 'Area:'}
		</label>
		<select
			id="gmb-area"
			class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
			value={selectedArea}
			on:change={handleAreaChange}
		>
			<option value="">Select an area</option>
			{#each areas as area}
				<option value={area}>
					{areaNames[area]}
				</option>
			{/each}
		</select>
	</div>

	<!-- Line Selection -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="gmb-line" class="w-full text-left">
			{translations.labelGmbLine || 'Line:'}
		</label>
		{#if loadingLines}
			<input
				id="gmb-line"
				type="text"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm animate-pulse"
				value="Loading routes..."
				disabled
			/>
		{:else}
			<select
				id="gmb-line"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				value={selectedLine}
				on:change={handleLineChange}
				disabled={loadingLines}
			>
				<option value="">Select a line</option>
				{#each gmbLines as line}
					<option value={line}>
						{line}
					</option>
				{/each}
			</select>
		{/if}
	</div>

	<!-- Direction Selection -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="gmb-direction" class="w-full text-left"> Direction: </label>
		{#if selectedLine && loadingDirections}
			<input
				id="gmb-direction"
				type="text"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm animate-pulse"
				value="Loading directions..."
				disabled
			/>
		{:else if selectedLine}
			<select
				id="gmb-direction"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				value={selectedDirection || ''}
				on:change={handleDirectionChange}
				disabled={loadingDirections}
			>
				<option value="">Select a direction</option>
				{#each gmbDirections as direction}
					<option value={direction.route_seq}>
						{direction.dest_en || `Direction ${direction.route_seq}`}
					</option>
				{/each}
			</select>
		{:else}
			<select
				id="gmb-direction"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				value={selectedDirection}
				disabled
			>
				<option value="">Select a route first</option>
			</select>
		{/if}
	</div>

	<!-- Stop Selection -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-center">
		<label for="gmb-stop" class="w-full text-left"> Stop: </label>
		{#if selectedDirection && gmbStops.length > 0 && selectedLine}
			<select
				id="gmb-stop"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				bind:value={selectedStopId}
			>
				<option value="">Select a stop</option>
				{#each gmbStops as stop}
					<option value={stop.stop_id}>
						{stop.name_en || stop.name_tc}
					</option>
				{/each}
			</select>
		{:else if selectedDirection && selectedLine && gmbStops.length === 0 && !loadingDirections}
			<input
				type="text"
				id="gmb-stop-id"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				placeholder="Enter stop ID"
				bind:value={selectedStopId}
			/>
		{:else}
			<input
				type="text"
				id="gmb-stop-id"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				placeholder={selectedDirection
					? 'Loading stops...'
					: 'Select a direction first'}
				value=""
				disabled={true}
			/>
		{/if}
	</div>
</div>
