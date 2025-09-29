<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import FormField from './FormField.svelte';

	const dispatch = createEventDispatcher();

	export let config;
	export let translations = {};
	export let loading = false;
	export let error = '';

	// Abstract methods that child components should implement
	export let fields = []; // Array of field configurations
	export let onSelectionChange = null; // Function to handle selection changes
	export let initializeFromConfig = null; // Function to initialize from existing config
	export let buildConfigValue = null; // Function to build the final config value

	let selections = {};

	// Initialize selections from config
	onMount(() => {
		if (initializeFromConfig) {
			selections = initializeFromConfig(config);
		}

		// Ensure all field IDs exist in selections
		fields.forEach(field => {
			if (!(field.id in selections)) {
				selections[field.id] = '';
			}
		});
	});

	// Handle field changes
	function handleFieldChange(fieldId, value) {
		// Create new selections object
		selections = { ...selections, [fieldId]: value };

		if (onSelectionChange) {
			// Call the handler which can modify selections
			onSelectionChange(selections, fieldId);
			// Force reactivity update
			selections = { ...selections };
		}

		// Build and dispatch config if we have a builder function
		if (buildConfigValue) {
			const configValue = buildConfigValue(selections);
			if (configValue !== null) {
				dispatch('configChange', { sta: configValue });
			}
		}
	}

	// Reactive field processing
	$: processedFields = fields.map(field => {
		if (typeof field.options === 'function') {
			return { ...field, options: field.options(selections) };
		}
		if (typeof field.disabled === 'function') {
			return { ...field, disabled: field.disabled(selections) };
		}
		return field;
	});

	// Watch for config changes and reinitialize if needed
	$: if (config && initializeFromConfig) {
		const newSelections = initializeFromConfig(config);
		// Only update if selections have actually changed to avoid infinite loops
		if (JSON.stringify(newSelections) !== JSON.stringify(selections)) {
			selections = newSelections;
		}
	}
</script>

<div class="space-y-4">
	{#if error}
		<div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
			{error}
		</div>
	{/if}

	{#each processedFields as field (field.id)}
		{#key selections}
			<FormField
				id={field.id}
				label={translations[field.labelKey] || field.label}
				type={field.type || 'select'}
				value={selections[field.id] || ''}
				options={field.options || []}
				disabled={field.disabled || loading}
				placeholder={field.placeholder}
				loading={field.loading}
				on:change={e => handleFieldChange(field.id, e.detail)}
			/>
		{/key}
	{/each}

	{#if loading}
		<div class="text-center py-2">
			<span class="text-gray-500">Loading...</span>
		</div>
	{/if}
</div>
