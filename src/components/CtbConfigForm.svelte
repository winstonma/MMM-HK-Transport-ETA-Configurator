<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let config;
  export let ctbRoutesData = [];
  export let ctbRouteStopsData = [];
  export let translations = {};
  export let currentLanguage = 'en'; // Use currentLanguage prop to match other components

  let selectedRoute = "";
  let selectedDirection = "";
  let selectedStop = "";

  // Reactive computed values
  $: uniqueRoutes = ctbRoutesData.map(route => route.route).sort((a, b) => 
    a.toString().localeCompare(b.toString(), undefined, { numeric: true })
  );

  // For CTB, we derive directions from the route stops data and route information
  $: directions = selectedRoute && ctbRouteStopsData && ctbRouteStopsData.length > 0 && ctbRoutesData && ctbRoutesData.length > 0
    ? [
        // Find route information for the selected route
        ...(ctbRouteStopsData.some(stop => stop.direction === 'outbound') 
          ? (() => {
              // Get route info for outbound direction
              const routeInfo = ctbRoutesData.find(r => r.route === selectedRoute);
              if (routeInfo) {
                return [{
                  value: 'outbound', 
                  text: `${routeInfo.orig_en || 'Origin'} → ${routeInfo.dest_en || 'Destination'}`, 
                  title: `Outbound: ${routeInfo.orig_en || 'Origin'} to ${routeInfo.dest_en || 'Destination'}` 
                }];
              } else {
                return [{ value: 'outbound', text: 'Outbound', title: 'Outbound direction' }];
              }
            })()
          : []),
        // Add inbound direction if there are inbound stops
        ...(ctbRouteStopsData.some(stop => stop.direction === 'inbound') 
          ? (() => {
              // Get route info for inbound direction (reverse of outbound)
              const routeInfo = ctbRoutesData.find(r => r.route === selectedRoute);
              if (routeInfo) {
                return [{
                  value: 'inbound', 
                  text: `${routeInfo.dest_en || 'Destination'} → ${routeInfo.orig_en || 'Origin'}`, 
                  title: `Inbound: ${routeInfo.dest_en || 'Destination'} to ${routeInfo.orig_en || 'Origin'}` 
                }];
              } else {
                return [{ value: 'inbound', text: 'Inbound', title: 'Inbound direction' }];
              }
            })()
          : [])
      ]
    : [];

  // For CTB, stops are filtered by direction from the route stops data
  $: stops = selectedRoute && selectedDirection && ctbRouteStopsData && ctbRouteStopsData.length > 0
    ? ctbRouteStopsData
        .filter(stop => stop.route === selectedRoute && stop.direction === selectedDirection)
        .sort((a, b) => parseInt(a.seq) - parseInt(b.seq))
        .map(stop => {
          // Use the appropriate language field for stop names
          let stopName = stop.name_en || stop.name_tc || stop.name_sc || stop.stop_name || `Stop ${stop.stop}`;
          if (currentLanguage === 'tc') {
            stopName = stop.name_tc || stop.name_en || stop.name_sc || stop.stop_name || `Stop ${stop.stop}`;
          } else if (currentLanguage === 'sc') {
            stopName = stop.name_sc || stop.name_en || stop.name_tc || stop.stop_name || `Stop ${stop.stop}`;
          }
          
          return { 
            value: stop.stop, 
            text: `${stop.seq}. ${stopName}`, 
            title: `${stopName} (Stop ID: ${stop.stop}, Sequence: ${stop.seq})` 
          };
        })
    : [];

  // Initialize from existing config
  onMount(() => {
    if (config.sta) {
      const staParts = config.sta.split('-');
      if (staParts.length === 3) { // e.g., "ROUTE-DIRECTION_ID-STOP_ID"
        const [route, direction, stopId] = staParts;
        selectedRoute = route;
        selectedDirection = direction;
        selectedStop = stopId;
      } else if (staParts.length === 1) { // e.g., "ROUTE"
        selectedRoute = staParts[0];
      }
    }
  });

  // Reset selectedDirection and selectedStop when selectedRoute changes
  $: if (selectedRoute) {
    dispatch('routeSelected', { route: selectedRoute });
    selectedDirection = ""; // Reset direction to trigger re-evaluation of directions and stops
    selectedStop = ""; // Reset stop
  }

  // Auto-select first direction if available
  $: if (directions.length > 0 && selectedDirection === "") {
    selectedDirection = directions[0].value;
  }

  // Update selectedStop when stops change (e.g., when selectedDirection changes)
  $: {
    const currentStopIsValid = stops.some(s => s.value === selectedStop);
    if (stops.length > 0 && (!selectedStop || !currentStopIsValid)) {
      selectedStop = stops[0].value; // Auto-select the first stop
    } else if (stops.length === 0) {
      selectedStop = ""; // No stops available
    }
  }

  // Dispatch configChange when selectedRoute, selectedDirection, or selectedStop changes
  $: {
    if (selectedRoute && selectedDirection !== "" && selectedStop) {
      const newSta = `${selectedRoute}-${selectedDirection}-${selectedStop}`;

      if (config.sta !== newSta) {
        dispatch('configChange', { sta: newSta, lang: currentLanguage }); // Pass language to parent
      }
    } else if (config.sta !== selectedRoute && selectedRoute && !selectedDirection && !selectedStop) {
      // If only route is selected, update config.sta to just the route
      dispatch('configChange', { sta: selectedRoute, lang: currentLanguage }); // Pass language to parent
    }
  }
</script>

<div class="space-y-4">
  <!-- CTB Route Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="ctbRouteSelect" class="w-full text-left">
      {translations.labelCtbRoute || "CTB Route:"}
    </label>
    <select
      id="ctbRouteSelect"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedRoute}
    >
      <option value="">-- Select Route --</option>
      {#each uniqueRoutes as routeNumber}
        <option value={routeNumber}>{routeNumber}</option>
      {/each}
    </select>
  </div>

  <!-- CTB Direction Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="ctbDirection" class="w-full text-left">
      {translations.labelCtbDirection || "Direction:"}
    </label>
    <select
      id="ctbDirection"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedDirection}
      disabled={!selectedRoute}
    >
      {#each directions as direction}
        <option value={direction.value} title={direction.title}>{direction.text}</option>
      {:else}
        <option value="" disabled>No directions available</option>
      {/each}
    </select>
  </div>

  <!-- CTB Stop Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="ctbStop" class="w-full text-left">
      {translations.labelCtbStop || "Stop:"}
    </label>
    <select
      id="ctbStop"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedStop}
      disabled={!selectedRoute || !selectedDirection}
    >
      {#each stops as stop}
        <option value={stop.value} title={stop.title}>{stop.text}</option>
      {:else}
        <option value="" disabled>No stops available</option>
      {/each}
    </select>
  </div>
</div>