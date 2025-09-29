<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import FormField from './shared/FormField.svelte';
	import { createOption, sortRoutes } from '../utils/configHelpers.js';

	const dispatch = createEventDispatcher();

	export let config;
	export let ctbRoutesData = [];
	export let ctbRouteStopsData = [];
	export let translations = {};
	export let currentLanguage = 'en';

	let selectedRoute = '';
	let selectedDirection = '';
	let selectedStop = '';

	function getStopName(stop, language) {
		if (language === 'tc') {
			return (
				stop.name_tc ||
				stop.name_en ||
				stop.name_sc ||
				stop.stop_name ||
				`Stop ${stop.stop}`
			);
		} else if (language === 'sc') {
			return (
				stop.name_sc ||
				stop.name_en ||
				stop.name_tc ||
				stop.stop_name ||
				`Stop ${stop.stop}`
			);
		}
		return (
			stop.name_en ||
			stop.name_tc ||
			stop.name_sc ||
			stop.stop_name ||
			`Stop ${stop.stop}`
		);
	}

	// Computed routes array
	$: routes = sortRoutes(ctbRoutesData.map(route => route.route)).map(route =>
		createOption(route, route)
	);

	// Computed directions array
	$: directions =
		selectedRoute && ctbRouteStopsData.length > 0 && ctbRoutesData.length > 0
			? (() => {
					const routeInfo = ctbRoutesData.find(r => r.route === selectedRoute);
					const dirs = [];

					if (ctbRouteStopsData.some(stop => stop.direction === 'outbound')) {
						const text = routeInfo
							? `${routeInfo.orig_en || 'Origin'} → ${routeInfo.dest_en || 'Destination'}`
							: 'Outbound';
						const title = routeInfo
							? `Outbound: ${routeInfo.orig_en || 'Origin'} to ${routeInfo.dest_en || 'Destination'}`
							: 'Outbound direction';
						dirs.push(createOption('outbound', text, title));
					}

					if (ctbRouteStopsData.some(stop => stop.direction === 'inbound')) {
						const text = routeInfo
							? `${routeInfo.dest_en || 'Destination'} → ${routeInfo.orig_en || 'Origin'}`
							: 'Inbound';
						const title = routeInfo
							? `Inbound: ${routeInfo.dest_en || 'Destination'} to ${routeInfo.orig_en || 'Origin'}`
							: 'Inbound direction';
						dirs.push(createOption('inbound', text, title));
					}

					return dirs;
				})()
			: [];

	// Computed stops array
	$: stops =
		selectedRoute && selectedDirection && ctbRouteStopsData.length > 0
			? ctbRouteStopsData
					.filter(
						stop =>
							stop.route === selectedRoute &&
							stop.direction === selectedDirection
					)
					.sort((a, b) => parseInt(a.seq) - parseInt(b.seq))
					.map(stop => {
						const stopName = getStopName(stop, currentLanguage);
						return createOption(
							stop.stop,
							`${stop.seq}. ${stopName}`,
							`${stopName} (Stop ID: ${stop.stop}, Sequence: ${stop.seq})`
						);
					})
			: [];

	// Update config when selections change
	$: if (selectedRoute && selectedDirection && selectedStop) {
		const newSta = `${selectedRoute}-${selectedDirection}-${selectedStop}`;
		if (config.sta !== newSta) {
			dispatch('configChange', { sta: newSta, lang: currentLanguage });
		}
	} else if (selectedRoute && !selectedDirection && !selectedStop) {
		// If only route is selected, update config.sta to just the route
		if (config.sta !== selectedRoute) {
			dispatch('configChange', { sta: selectedRoute, lang: currentLanguage });
		}
	}

	// Initialize from existing config
	onMount(() => {
		if (config.sta) {
			const staParts = config.sta.split('-');
			if (staParts.length === 3) {
				const [route, direction, stopId] = staParts;
				selectedRoute = route;
				selectedDirection = direction;
				selectedStop = stopId;
			} else if (staParts.length === 1) {
				selectedRoute = staParts[0];
			}
		}
	});

	// Handle route selection
	function handleRouteChange(newRoute) {
		selectedRoute = newRoute;
		selectedDirection = '';
		selectedStop = '';

		// Emit route selected event for parent to load route stops data
		if (newRoute) {
			dispatch('routeSelected', { route: newRoute });
		}
	}

	// Auto-select first direction if available
	$: if (directions.length > 0 && selectedDirection === '') {
		selectedDirection = directions[0].value;
	}

	// Auto-select first stop when direction changes
	$: if (selectedDirection && stops.length > 0 && !selectedStop) {
		selectedStop = stops[0].value;
	}

	// Reset stop when direction changes and current stop is not valid
	$: if (selectedDirection && stops.length > 0) {
		const currentStopIsValid = stops.some(s => s.value === selectedStop);
		if (!currentStopIsValid) {
			selectedStop = stops[0].value;
		}
	} else if (selectedDirection && stops.length === 0) {
		selectedStop = '';
	}
</script>

<div class="space-y-4">
	<!-- CTB Route Selection -->
	<FormField
		id="ctbRouteSelect"
		label={translations.labelCtbRoute || 'CTB Route:'}
		value={selectedRoute}
		options={routes}
		placeholder="-- Select Route --"
		on:change={e => handleRouteChange(e.detail)}
	/>

	<!-- CTB Direction Selection -->
	<FormField
		id="ctbDirection"
		label={translations.labelCtbDirection || 'Direction:'}
		value={selectedDirection}
		options={directions}
		placeholder="-- Select Direction --"
		disabled={!selectedRoute}
		on:change={e => (selectedDirection = e.detail)}
	/>

	<!-- CTB Stop Selection -->
	<FormField
		id="ctbStop"
		label={translations.labelCtbStop || 'Stop:'}
		value={selectedStop}
		options={stops}
		placeholder="-- Select Stop --"
		disabled={!selectedRoute || !selectedDirection}
		on:change={e => (selectedStop = e.detail)}
	/>
</div>
