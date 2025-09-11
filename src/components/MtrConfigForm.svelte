<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let config;
  export let mtrLinesData;
  export let translations;
  
  let selectedLine = "";
  let selectedStation = "";
  let stations = [];
  
  // Computed lines array
  $: lines = Object.keys(mtrLinesData || {});
  
  // Update stations and selectedStation when selectedLine changes
  $: {
    if (selectedLine && mtrLinesData[selectedLine]) {
      stations = mtrLinesData[selectedLine].stations || [];
      // Only auto-select the first station if the current selectedStation is not valid for the new line
      // or if no station is currently selected.
      const currentStationIsValid = stations.some(s => s.code === selectedStation);
      if (stations.length > 0 && (!selectedStation || !currentStationIsValid)) {
        selectedStation = stations[0].code;
      } else if (stations.length === 0) {
        selectedStation = ""; // No stations for this line
      }
    } else {
      stations = [];
      selectedStation = "";
    }
  }
  
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
      const staParts = config.sta.split("-");
      selectedLine = staParts[0] || "";
      selectedStation = staParts[1] || "";
    } else if (lines.length > 0) {
      selectedLine = lines[0];
    }
  });
  
  // Auto-select first line if none selected and lines are available
  $: if (lines.length > 0 && !selectedLine) {
    selectedLine = lines[0];
  }
</script>

<div class="space-y-4">
  <!-- MTR Line Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="mtrLine" class="w-full text-left">
      {translations.labelMtrLine || "MTR Line:"}
    </label>
    <select
      id="mtrLine"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedLine}
    >
      {#each lines as lineCode}
        <option value={lineCode}>
          {mtrLinesData[lineCode]?.en || lineCode}
        </option>
      {/each}
    </select>
  </div>

  <!-- MTR Station Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="mtrStation" class="w-full text-left">
      {translations.labelMtrStation || "MTR Station:"}
    </label>
    <select
      id="mtrStation"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedStation}
    >
      {#each stations as station}
        <option value={station.code}>
          {station.en}
        </option>
      {/each}
    </select>
  </div>
</div>