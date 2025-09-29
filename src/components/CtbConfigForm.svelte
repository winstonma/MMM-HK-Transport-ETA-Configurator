<script>
	import { createEventDispatcher } from 'svelte';
	import BaseConfigForm from './shared/BaseConfigForm.svelte';
	import {
		createOption,
		parseStationId,
		buildStationId,
		sortRoutes,
	} from '../utils/configHelpers.js';

	const dispatch = createEventDispatcher();

	export let config;
	export let ctbRoutesData = [];
	export let ctbRouteStopsData = [];
	export let translations = {};
	export let currentLanguage = 'en';

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

	function getDirections(route, routeStopsData, routesData) {
		if (!route || !routeStopsData.length || !routesData.length) return [];

		const routeInfo = routesData.find(r => r.route === route);
		const directions = [];

		if (routeStopsData.some(stop => stop.direction === 'outbound')) {
			const text = routeInfo
				? `${routeInfo.orig_en || 'Origin'} → ${routeInfo.dest_en || 'Destination'}`
				: 'Outbound';
			const title = routeInfo
				? `Outbound: ${routeInfo.orig_en || 'Origin'} to ${routeInfo.dest_en || 'Destination'}`
				: 'Outbound direction';
			directions.push(createOption('outbound', text, title));
		}

		if (routeStopsData.some(stop => stop.direction === 'inbound')) {
			const text = routeInfo
				? `${routeInfo.dest_en || 'Destination'} → ${routeInfo.orig_en || 'Origin'}`
				: 'Inbound';
			const title = routeInfo
				? `Inbound: ${routeInfo.dest_en || 'Destination'} to ${routeInfo.orig_en || 'Origin'}`
				: 'Inbound direction';
			directions.push(createOption('inbound', text, title));
		}

		return directions;
	}

	function getStops(route, direction, routeStopsData, language) {
		if (!route || !direction || !routeStopsData.length) return [];

		return routeStopsData
			.filter(stop => stop.route === route && stop.direction === direction)
			.sort((a, b) => parseInt(a.seq) - parseInt(b.seq))
			.map(stop => {
				const stopName = getStopName(stop, language);
				return createOption(
					stop.stop,
					`${stop.seq}. ${stopName}`,
					`${stopName} (Stop ID: ${stop.stop}, Sequence: ${stop.seq})`
				);
			});
	}

	// Field configuration
	$: fields = [
		{
			id: 'route',
			labelKey: 'labelCtbRoute',
			label: 'CTB Route:',
			placeholder: '-- Select Route --',
			options: sortRoutes(ctbRoutesData.map(route => route.route)).map(route =>
				createOption(route, route)
			),
		},
		{
			id: 'direction',
			labelKey: 'labelCtbDirection',
			label: 'Direction:',
			placeholder: '-- Select Direction --',
			disabled: selections => !selections.route,
			options: selections =>
				getDirections(selections.route, ctbRouteStopsData, ctbRoutesData),
		},
		{
			id: 'stop',
			labelKey: 'labelCtbStop',
			label: 'Stop:',
			placeholder: '-- Select Stop --',
			disabled: selections => !selections.route || !selections.direction,
			options: selections =>
				getStops(
					selections.route,
					selections.direction,
					ctbRouteStopsData,
					currentLanguage
				),
		},
	];

	function initializeFromConfig(config) {
		if (config.sta) {
			const parts = parseStationId(config.sta);
			if (parts.length === 3) {
				return { route: parts[0], direction: parts[1], stop: parts[2] };
			} else if (parts.length === 1) {
				return { route: parts[0], direction: '', stop: '' };
			}
		}
		return { route: '', direction: '', stop: '' };
	}

	function onSelectionChange(selections, changedField) {
		if (changedField === 'route') {
			// Emit route selected event for parent to load route stops data
			dispatch('routeSelected', { route: selections.route });
			selections.direction = '';
			selections.stop = '';
		} else if (changedField === 'direction') {
			selections.stop = '';

			// Auto-select first stop if available
			const stops = getStops(
				selections.route,
				selections.direction,
				ctbRouteStopsData,
				currentLanguage
			);
			if (stops.length > 0) {
				selections.stop = stops[0].value;
			}
		}
		return selections;
	}

	function buildConfigValue(selections) {
		if (selections.route && selections.direction && selections.stop) {
			return buildStationId([
				selections.route,
				selections.direction,
				selections.stop,
			]);
		} else if (selections.route && !selections.direction && !selections.stop) {
			return selections.route;
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
	on:routeSelected
/>
