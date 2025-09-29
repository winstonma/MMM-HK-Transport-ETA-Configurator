<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let config;
  export let lrtStationsData = {};
  export let translations;

  let selectedStation = "";
  let allStations = [];
  
  // Flatten all stations from all zones into a single array
  $: {
    allStations = [];
    Object.values(lrtStationsData).forEach(zoneData => {
      if (zoneData.stations) {
        allStations = allStations.concat(zoneData.stations);
      }
    });
  }
  
  // Update config when station selection changes
  $: if (selectedStation) {
    const newSta = selectedStation; // For LRT, the station_id is the sta value
    if (config.sta !== newSta) {
      dispatch('configChange', { sta: newSta });
    }
  }
  
  // Initialize from existing config
  onMount(() => {
    if (config.sta && !config.sta.includes('-')) {
      // If sta is not in zone-station format, it should be a station ID
      selectedStation = config.sta;
    } else if (allStations.length > 0) {
      // Auto select the first station if none is selected
      selectedStation = allStations[0].station_id.toString();
    }
  });
  
  // Auto-select first station if none selected and stations are available
  $: if (allStations.length > 0 && !selectedStation) {
    selectedStation = allStations[0].station_id.toString();
  }
</script>

<div class="space-y-4">
  <!-- LRT Station Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="lrtStation" class="w-full text-left">
      {translations.labelLrtStation || "LRT Station:"}
    </label>
    <select
      id="lrtStation"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedStation}
    >
      {#each allStations as station}
        <option value={station.station_id}>
          {station.eng_name}
        </option>
      {/each}
    </select>
  </div>
</div>