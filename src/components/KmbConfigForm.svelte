<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let config;
  export let kmbRoutesData = {};
  export let kmbRouteStopData = [];
  export let translations = {};
  export let currentLanguage = "en";

  let selectedRoute = "";
  let selectedDirection = "";
  let selectedStop = "";
  let loading = false;
  let error = "";

  // Reactive computed values
  $: uniqueRoutes = Object.keys(kmbRoutesData).sort((a, b) => 
    a.toString().localeCompare(b.toString(), undefined, { numeric: true })
  );

  $: directions = selectedRoute && kmbRoutesData[selectedRoute] 
    ? kmbRoutesData[selectedRoute].map((routeData, index) => {
        const originText = routeData[`orig_${currentLanguage}`] || routeData.orig_en;
        const destinationText = routeData[`dest_${currentLanguage}`] || routeData.dest_en;
        return { 
          value: index, 
          text: `${originText} → ${destinationText}`, 
          title: `Route ${selectedRoute} - ${originText} → ${destinationText}` 
        };
      })
    : [];

  $: stops = getStopsForRoute(selectedRoute, selectedDirection);

  // Helper function to find routes for a stop
  function findRoutesForStop(stopId) {
    const routes = [];
    if (kmbRouteStopData && kmbRouteStopData.length > 0) {
      const routesSet = new Set();
      kmbRouteStopData.forEach((routeStop) => {
        if (routeStop.stop === stopId) {
          routesSet.add(routeStop.route);
        }
      });
      routes.push(...routesSet);
    }
    return routes;
  }

  // Get stops for selected route and direction
  function getStopsForRoute(route, directionIndex) {
    if (!route || directionIndex === "" || !kmbRoutesData[route] || !kmbRoutesData[route][directionIndex]) {
      return [];
    }

    const routeVariant = kmbRoutesData[route][directionIndex];
    const bound = routeVariant.bound === "1" ? "O" : routeVariant.bound === "2" ? "I" : routeVariant.bound;
    const serviceType = routeVariant.service_type;

    const filteredStops = kmbRouteStopData.filter(
      (routeStop) =>
        routeStop.route === route &&
        routeStop.bound === bound &&
        routeStop.service_type === serviceType,
    );

    if (filteredStops.length > 0) {
      filteredStops.sort((a, b) => parseInt(a.seq) - parseInt(b.seq));
      
      return filteredStops.map(stop => {
        const stopInfo = window.cachedStopData?.find((s) => s.stop === stop.stop);
        const stopName = stopInfo?.name_en || `Stop ${stop.stop}`;
        return { 
          value: stop.stop, 
          text: `${stop.seq}. ${stopName}`, 
          title: `${stopName} (Sequence: ${stop.seq})` 
        };
      });
    }
    return [];
  }

  // Initialize from existing config
  onMount(() => {
    if (config.sta) {
      const staParts = config.sta.split('-');
      if (staParts.length === 4) {
        const [route, serviceType, bound, stopCode] = staParts;
        selectedRoute = route;
        selectedStop = stopCode;

        // Find the correct direction index
        if (kmbRoutesData[route]) {
          const directionIndex = kmbRoutesData[route].findIndex(
            (routeData) =>
              (routeData.bound === "1" && bound === "O") || (routeData.bound === "2" && bound === "I") || routeData.bound === bound &&
              routeData.service_type === serviceType
          );
          if (directionIndex !== -1) {
            selectedDirection = directionIndex;
          }
        }
      } else {
        // Fallback for older config.sta format or if stop is missing
        const routes = findRoutesForStop(config.sta);
        if (routes.length > 0) {
          selectedRoute = routes[0];
          selectedStop = config.sta;
        }
      }
    }
  });

  // Reset selectedDirection and selectedStop when selectedRoute changes
  $: if (selectedRoute) {
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
      const routeVariant = kmbRoutesData[selectedRoute]?.[selectedDirection];
      if (routeVariant) {
        const bound = routeVariant.bound === "1" ? "O" : routeVariant.bound === "2" ? "I" : routeVariant.bound;
        const serviceType = routeVariant.service_type;
        const newSta = `${selectedRoute}-${serviceType}-${bound}-${selectedStop}`;

        if (config.sta !== newSta) {
          dispatch('configChange', { sta: newSta });
        }
      }
    }
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
    </div>
  {/if}

  <!-- KMB Route Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="kmbRouteSelect" class="w-full text-left">
      {translations.labelKmbRoute || "KMB Route:"}
    </label>
    <select
      id="kmbRouteSelect"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedRoute}
      disabled={loading}
    >
      <option value="">-- Select Route --</option>
      {#each uniqueRoutes as routeNumber}
        <option value={routeNumber}>{routeNumber}</option>
      {/each}
    </select>
  </div>

  <!-- KMB Direction Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="kmbDestination" class="w-full text-left">
      {translations.labelKmbDirection || "KMB Direction:"}
    </label>
    <select
      id="kmbDestination"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedDirection}
      disabled={loading || !selectedRoute}
    >
      {#each directions as direction}
        <option value={direction.value} title={direction.title}>{direction.text}</option>
      {/each}
    </select>
  </div>

  <!-- KMB Stop Selection -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-center">
    <label for="kmbStop" class="w-full text-left">
      {translations.labelKmbStop || "KMB Stop:"}
    </label>
    <select
      id="kmbStop"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
      bind:value={selectedStop}
      disabled={loading || !selectedRoute || selectedDirection === ""}
    >
      {#each stops as stop}
        <option value={stop.value} title={stop.title}>{stop.text}</option>
      {:else}
        <option value="" disabled>No stops available</option>
      {/each}
    </select>
  </div>

  {#if loading}
    <div class="text-center py-2">
      <span class="text-gray-500">Loading...</span>
    </div>
  {/if}
</div>
