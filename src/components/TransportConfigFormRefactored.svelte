<script>
	import { onMount } from 'svelte';
	import KmbConfigForm from './KmbConfigForm.svelte';
	import MtrConfigForm from './MtrConfigForm.svelte';
	import MtrbusConfigForm from './MtrbusConfigForm.svelte';
	import CtbConfigForm from './CtbConfigForm.svelte';
	import GmbConfigForm from './GmbConfigForm.svelte';
	import LrtConfigForm from './LrtConfigForm.svelte';
	import Toast from './Toast.svelte';
	import FormField from './shared/FormField.svelte';

	import {
		config,
		translations,
		mtrLinesData,
		kmbRoutesData,
		kmbRouteStopData,
		mtrbusRoutesData,
		ctbRoutesData,
		ctbRouteStopsData,
		gmbRoutesData,
		lrtStationsData,
		loading,
		error,
		showAdvanced,
		toast,
		jsonOutput,
		updateConfig,
		loadTranslations,
		loadProviderData,
		loadCtbRouteStops,
		showToast,
	} from '../stores/transportConfig.js';

	// Props
	export let initialConfig = {};

	// Provider options
	const providerOptions = [
		{ value: 'kmb', text: 'KMB' },
		{ value: 'mtr', text: 'MTR' },
		{ value: 'mtrbus', text: 'MTR Bus' },
		{ value: 'ctb', text: 'CTB' },
		{ value: 'gmb', text: 'GMB' },
		{ value: 'lrt', text: 'LRT' },
	];

	// Initialize config and load initial data
	onMount(async () => {
		if (Object.keys(initialConfig).length > 0) {
			updateConfig(initialConfig);
		}

		try {
			loading.set(true);
			await loadTranslations('en');
			await loadProviderData($config.transportETAProvider);
		} catch (err) {
			console.error('Failed to load initial data:', err);
		} finally {
			loading.set(false);
		}
	});

	// Handle provider change
	async function handleProviderChange(newProvider) {
		updateConfig({ transportETAProvider: newProvider, sta: '' });

		try {
			loading.set(true);
			await loadProviderData(newProvider);
		} catch (err) {
			console.error(`Failed to load ${newProvider} data:`, err);
		} finally {
			loading.set(false);
		}
	}

	// Handle CTB route selection
	async function handleCtbRouteSelected(event) {
		const route = event.detail.route;
		if (route) {
			try {
				await loadCtbRouteStops(route);
			} catch (err) {
				console.error('Failed to load CTB route stops:', err);
			}
		}
	}

	// Copy to clipboard
	async function copyToClipboard() {
		if ($jsonOutput) {
			try {
				await navigator.clipboard.writeText($jsonOutput);
				showToast('Configuration copied to clipboard!', 'success');
			} catch (err) {
				console.error('Failed to copy:', err);
				showToast('Failed to copy configuration. Please try again.', 'error');
			}
		}
	}

	// Helper function to check if value is different from default
	function isDifferentFromDefault(key, value) {
		const defaults = {
			reloadInterval: 60000,
			updateInterval: 5000,
			animationSpeed: 2500,
			initialLoadDelay: 0,
		};
		return value !== defaults[key];
	}
</script>

<div class="max-w-4xl mx-auto p-4">
	<h1>{$translations.pageTitle || 'MMM-HK-Transport-ETA Configuration'}</h1>
	<p>
		{@html $translations.pageDescription ||
			'Configure your module settings below.'}
	</p>

	{#if $error}
		<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
			{$error}
		</div>
	{/if}

	{#if $loading}
		<div
			class="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded"
		>
			Loading configuration data...
		</div>
	{/if}

	<form class="space-y-4">
		<!-- Provider Selection -->
		<FormField
			id="provider"
			label={$translations.labelTransportETAProvider ||
				'Transport ETA Provider:'}
			value={$config.transportETAProvider}
			options={providerOptions}
			disabled={$loading}
			on:change={e => handleProviderChange(e.detail)}
		/>

		<!-- Dynamic Provider Forms -->
		{#if $config.transportETAProvider === 'mtr'}
			<MtrConfigForm
				config={$config}
				mtrLinesData={$mtrLinesData}
				translations={$translations}
				on:configChange={e => updateConfig(e.detail)}
			/>
		{:else if $config.transportETAProvider === 'kmb'}
			<KmbConfigForm
				config={$config}
				kmbRoutesData={$kmbRoutesData}
				kmbRouteStopData={$kmbRouteStopData}
				translations={$translations}
				currentLanguage="en"
				on:configChange={e => updateConfig(e.detail)}
			/>
		{:else if $config.transportETAProvider === 'mtrbus'}
			<MtrbusConfigForm
				config={$config}
				translations={$translations}
				mtrbusRoutesData={$mtrbusRoutesData}
				on:configChange={e => updateConfig(e.detail)}
			/>
		{:else if $config.transportETAProvider === 'ctb'}
			<CtbConfigForm
				config={$config}
				ctbRoutesData={$ctbRoutesData}
				ctbRouteStopsData={$ctbRouteStopsData}
				translations={$translations}
				currentLanguage="en"
				on:configChange={e => updateConfig(e.detail)}
				on:routeSelected={handleCtbRouteSelected}
			/>
		{:else if $config.transportETAProvider === 'gmb'}
			<GmbConfigForm
				config={$config}
				gmbRoutesData={$gmbRoutesData}
				translations={$translations}
				currentLanguage="en"
				on:configChange={e => updateConfig(e.detail)}
			/>
		{:else if $config.transportETAProvider === 'lrt'}
			<LrtConfigForm
				config={$config}
				lrtStationsData={$lrtStationsData}
				translations={$translations}
				on:configChange={e => updateConfig(e.detail)}
			/>
		{:else}
			<!-- Manual STA input -->
			<FormField
				id="sta"
				type="text"
				label={$translations.labelSta || 'Station/Stop ID:'}
				value={$config.sta}
				placeholder="Enter station/stop ID"
				on:change={e => updateConfig({ sta: e.detail })}
			/>
		{/if}

		<!-- Advanced Settings Toggle -->
		<button
			type="button"
			class="advanced-settings-toggle w-full text-left py-2 focus:outline-none flex items-center justify-between"
			on:click={() => showAdvanced.update(v => !v)}
		>
			<span>{$translations.advancedSettingsText || 'Advanced Settings'}</span>
			<i class="fas fa-chevron-{$showAdvanced ? 'up' : 'down'}"></i>
		</button>

		{#if $showAdvanced}
			<div class="space-y-4 border-t pt-4">
				<!-- Reload Interval -->
				<FormField
					id="reloadInterval"
					type="text"
					label={$translations.labelReloadInterval ||
						'Reload Interval (minutes):'}
					value={$config.reloadInterval}
					on:change={e => updateConfig({ reloadInterval: parseInt(e.detail) })}
				/>

				<!-- Update Interval -->
				<FormField
					id="updateInterval"
					type="text"
					label={$translations.labelUpdateInterval ||
						'Update Interval (seconds):'}
					value={$config.updateInterval}
					on:change={e => updateConfig({ updateInterval: parseInt(e.detail) })}
				/>

				<!-- Animation Speed -->
				<FormField
					id="animationSpeed"
					type="text"
					label={$translations.labelAnimationSpeed ||
						'Animation Speed (milliseconds):'}
					value={$config.animationSpeed}
					on:change={e => updateConfig({ animationSpeed: parseInt(e.detail) })}
				/>

				<!-- Initial Load Delay -->
				<FormField
					id="initialLoadDelay"
					type="text"
					label={$translations.labelInitialLoadDelay ||
						'Initial Load Delay (milliseconds):'}
					value={$config.initialLoadDelay}
					on:change={e =>
						updateConfig({ initialLoadDelay: parseInt(e.detail) })}
				/>
			</div>
		{/if}
	</form>

	<hr class="my-6 border-gray-300" />

	<!-- JSON Output -->
	<div class="mb-4 grid grid-cols-2 gap-4 items-start">
		<label for="jsonOutput" class="w-full text-left">
			{$translations.labelJsonOutput || 'Copy updated config.json content:'}
		</label>
		<div class="json-output-container w-full relative">
			<textarea
				id="jsonOutput"
				class="block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				rows="10"
				readonly
				value={$jsonOutput}
			></textarea>
			<button
				class="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
				on:click={copyToClipboard}
				title="Copy to clipboard"
				aria-label="Copy configuration to clipboard"
				disabled={!$jsonOutput}
			>
				<i class="fas fa-copy"></i>
			</button>
		</div>
	</div>
</div>

<!-- Toast Notification -->
<Toast
	bind:show={$toast.show}
	message={$toast.message}
	type={$toast.type}
	duration={3000}
/>
