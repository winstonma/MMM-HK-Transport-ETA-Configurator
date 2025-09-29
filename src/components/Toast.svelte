<script>
	import { onMount } from 'svelte';

	export let message = '';
	export let type = 'info'; // info, success, error, warning
	export let duration = 3000;
	export let show = false;

	let timeoutId;

	$: if (show && duration > 0) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			show = false;
		}, duration);
	}

	$: typeClasses = {
		info: 'bg-blue-100 border-blue-400 text-blue-700',
		success: 'bg-green-100 border-green-400 text-green-700',
		error: 'bg-red-100 border-red-400 text-red-700',
		warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
	};
</script>

{#if show}
	<div
		class="fixed top-4 right-4 p-3 border rounded shadow-lg z-50 transition-all duration-300 {typeClasses[
			type
		]}"
		role="alert"
	>
		<div class="flex items-center justify-between">
			<span>{message}</span>
			<button
				class="ml-4 text-lg leading-none"
				on:click={() => (show = false)}
				aria-label="Close notification"
			>
				×
			</button>
		</div>
	</div>
{/if}
