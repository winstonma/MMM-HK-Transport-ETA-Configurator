<script>
	export let label;
	export let id;
	export let type = 'select';
	export let value = '';
	export let options = [];
	export let disabled = false;
	export let placeholder = '';
	export let loading = false;
	export const required = false;

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function handleChange(event) {
		dispatch('change', event.target.value);
	}
</script>

<div class="mb-4 grid grid-cols-2 gap-4 items-center">
	<label for={id} class="w-full text-left">
		{label}
	</label>

	{#if type === 'select'}
		{#if loading}
			<input
				{id}
				type="text"
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm animate-pulse"
				value="Loading..."
				disabled
			/>
		{:else}
			<select
				{id}
				class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
				{value}
				{disabled}
				on:change={handleChange}
			>
				{#if placeholder}
					<option value="">{placeholder}</option>
				{/if}
				{#each options as option}
					<option value={option.value} title={option.title || option.text}>
						{option.text}
					</option>
				{:else}
					{#if !placeholder}
						<option value="" disabled>No options available</option>
					{/if}
				{/each}
			</select>
		{/if}
	{:else if type === 'text'}
		<input
			{id}
			type="text"
			class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
			{value}
			{placeholder}
			{disabled}
			on:input={handleChange}
		/>
	{/if}
</div>
