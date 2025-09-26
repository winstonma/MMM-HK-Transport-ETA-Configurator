<script>
  import { onMount } from 'svelte';
  import KmbConfigForm from './KmbConfigForm.svelte';
  import MtrConfigForm from './MtrConfigForm.svelte';
  import MtrbusConfigForm from './MtrbusConfigForm.svelte';
  import CtbConfigForm from './CtbConfigForm.svelte';
  import GmbConfigForm from './GmbConfigForm.svelte';
  import Toast from './Toast.svelte';
  import { dataService } from '../utils/dataService.js';
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
    loading,
    error,
    showAdvanced,
    toast,
    jsonOutput,
    updateConfig
  } from '../stores/config.js';
  
  // Props
  export let initialConfig = {};
  
  // Initialize config store with initial values
  onMount(() => {
    if (Object.keys(initialConfig).length > 0) {
      updateConfig(initialConfig);
    }
  });
  
  // Load initial data
  async function loadInitialData() {
    loading.set(true);
    error.set("");
    
    try {
      const [translationsData, mtrData] = await Promise.all([
        dataService.loadTranslations("en"),
        dataService.loadMtrLinesData()
      ]);
      
      translations.set(translationsData);
      mtrLinesData.set(mtrData);
      
      // Load KMB data if needed
      if ($config.transportETAProvider === "kmb") {
        const kmbData = await dataService.loadKmbData();
        kmbRoutesData.set(kmbData.kmbRoutesData);
        kmbRouteStopData.set(kmbData.kmbRouteStopData);
      } else if ($config.transportETAProvider === "mtrbus") {
        const mtrbusData = await dataService.loadMtrbusRoutesData();
        mtrbusRoutesData.set(mtrbusData);
      } else if ($config.transportETAProvider === "ctb") {
        const ctbData = await dataService.loadCtbData();
        ctbRoutesData.set(ctbData.ctbRoutesData);
      } else if ($config.transportETAProvider === "gmb") {
        const gmbData = await dataService.loadGmbData();
        gmbRoutesData.set(gmbData.gmbRoutesData);
      }
    } catch (err) {
      error.set(`Failed to load initial data: ${err.message}`);
    } finally {
      loading.set(false);
    }
  }
  
  onMount(() => {
    if (Object.keys(initialConfig).length > 0) {
      updateConfig(initialConfig);
    }
    loadInitialData();
  });
  
  async function handleProviderChange() {
    // Reset sta when provider changes
    updateConfig({ sta: "" });
    // Clear CTB route stops data if provider changes from CTB or to CTB
    if ($config.transportETAProvider !== "ctb") {
      ctbRouteStopsData.set([]);
    }
    
    // Load provider-specific data
    if ($config.transportETAProvider === "kmb" && Object.keys($kmbRoutesData).length === 0) {
      loading.set(true);
      try {
        const kmbData = await dataService.loadKmbData();
        kmbRoutesData.set(kmbData.kmbRoutesData);
        kmbRouteStopData.set(kmbData.kmbRouteStopData);
      } catch (err) {
        error.set(`Failed to load KMB data: ${err.message}`);
      } finally {
        loading.set(false);
      }
    } else if ($config.transportETAProvider === "mtrbus" && Object.keys($mtrbusRoutesData).length === 0) {
      loading.set(true);
      try {
        const mtrbusData = await dataService.loadMtrbusRoutesData();
        mtrbusRoutesData.set(mtrbusData);
      } catch (err) {
        error.set(`Failed to load MTR Bus data: ${err.message}`);
      } finally {
        loading.set(false);
      }
    } else if ($config.transportETAProvider === "ctb" && Object.keys($ctbRoutesData).length === 0) {
      loading.set(true);
      try {
        const ctbData = await dataService.loadCtbData();
        ctbRoutesData.set(ctbData.ctbRoutesData);
      } catch (err) {
        error.set(`Failed to load CTB data: ${err.message}`);
      } finally {
        loading.set(false);
      }
    } else if ($config.transportETAProvider === "gmb" && Object.keys($gmbRoutesData).length === 0) {
      loading.set(true);
      try {
        const gmbData = await dataService.loadGmbData();
        gmbRoutesData.set(gmbData.gmbRoutesData);
      } catch (err) {
        error.set(`Failed to load GMB data: ${err.message}`);
      } finally {
        loading.set(false);
      }
    }
  }
  
  
  
  async function copyToClipboard() {
    if ($jsonOutput) {
      try {
        await navigator.clipboard.writeText($jsonOutput);
        toast.set({ show: true, message: "Configuration copied to clipboard!", type: "success" });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast.set({ show: true, message: "Failed to copy configuration. Please try again.", type: "error" });
      }
    }
  }
  
  // Helper function to check if value is different from default
  function isDifferentFromDefault(key, value) {
    const defaults = {
      reloadInterval: 60000,
      updateInterval: 5000,
      animationSpeed: 2500,
      initialLoadDelay: 0
    };
    return value !== defaults[key];
  }
  
  // Helper function to update config values
  function handleConfigChange(key, value) {
    updateConfig({ [key]: value });
  }
</script>

<div class="max-w-4xl mx-auto p-4">
  <h1>{$translations.pageTitle || "MMM-HK-Transport-ETA Configuration"}</h1>
  <p>{@html $translations.pageDescription || "Configure your module settings below."}</p>

  {#if $error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {$error}
    </div>
  {/if}

  {#if $loading}
    <div class="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
      Loading configuration data...
    </div>
  {/if}

  <form class="space-y-4">
    <!-- Provider Selection -->
    <div class="mb-4 grid grid-cols-2 gap-4 items-center">
      <label for="provider" class="w-full text-left">
        {$translations.labelTransportETAProvider || "Transport ETA Provider:"}
      </label>
      <select
        id="provider"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
        value={$config.transportETAProvider}
        on:change={(e) => { handleConfigChange('transportETAProvider', e.target.value); handleProviderChange(); }}
        disabled={$loading}
      >
        <option value="kmb">KMB</option>
        <option value="mtr">MTR</option>
        <option value="mtrbus">MTR Bus</option>
        <option value="ctb">CTB</option>
        <option value="gmb">GMB</option>
      </select>
    </div>

    <!-- Dynamic Provider Forms -->
    {#if $config.transportETAProvider === "mtr"}
      <MtrConfigForm 
        config={$config}
        mtrLinesData={$mtrLinesData}
        translations={$translations}
        on:configChange={(e) => updateConfig(e.detail)}
      />
    {:else if $config.transportETAProvider === "kmb"}
      <KmbConfigForm
        config={$config}
        kmbRoutesData={$kmbRoutesData}
        kmbRouteStopData={$kmbRouteStopData}
        translations={$translations}
        currentLanguage="en"
        on:configChange={(e) => updateConfig(e.detail)}
      />
    {:else if $config.transportETAProvider === "mtrbus"}
      <MtrbusConfigForm
        config={$config}
        translations={$translations}
        mtrbusRoutesData={$mtrbusRoutesData}
        on:configChange={(e) => updateConfig(e.detail)}
      />
    {:else if $config.transportETAProvider === "ctb"}
      <CtbConfigForm
        config={$config}
        ctbRoutesData={$ctbRoutesData}
        ctbRouteStopsData={$ctbRouteStopsData}
        translations={$translations}
        currentLanguage="en"
        on:configChange={(e) => updateConfig(e.detail)}
        on:routeSelected={(e) => {
          const selectedRoute = e.detail.route;
          if (selectedRoute) {
            loading.set(true);
            dataService.loadCtbRouteStopsData(selectedRoute)
              .then(data => ctbRouteStopsData.set(data))
              .catch(err => error.set(`Failed to load CTB route stops data: ${err.message}`))
              .finally(() => loading.set(false));
          }
        }}
      />
    {:else if $config.transportETAProvider === "gmb"}
      <GmbConfigForm
        config={$config}
        gmbRoutesData={$gmbRoutesData}
        translations={$translations}
        currentLanguage="en"
        on:configChange={(e) => updateConfig(e.detail)}
      />
    {:else}
      <!-- Manual STA input -->
      <div class="mb-4 grid grid-cols-2 gap-4 items-center">
        <label for="sta" class="w-full text-left">
          {$translations.labelSta || "Station/Stop ID:"}
        </label>
        <input
          type="text"
          id="sta"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
          value={$config.sta}
          on:input={(e) => handleConfigChange('sta', e.target.value)}
        />
      </div>
    {/if}

    <!-- Advanced Settings Toggle -->
    <button
      type="button"
      class="advanced-settings-toggle w-full text-left py-2 focus:outline-none flex items-center justify-between"
      on:click={() => showAdvanced.update(v => !v)}
    >
      <span>{$translations.advancedSettingsText || "Advanced Settings"}</span>
      <i class="fas fa-chevron-{$showAdvanced ? 'up' : 'down'}"></i>
    </button>

    {#if $showAdvanced}
      <div class="space-y-4 border-t pt-4">
        <!-- Reload Interval -->
        <div class="mb-4 grid grid-cols-2 gap-4 items-center">
          <label for="reloadInterval" class="w-full text-left">
            {$translations.labelReloadInterval || "Reload Interval (minutes):"}
          </label>
          <input
            type="number"
            id="reloadInterval"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            value={$config.reloadInterval}
            on:input={(e) => handleConfigChange('reloadInterval', parseInt(e.target.value))}
            min="1"
            class:border-green-500={!isDifferentFromDefault('reloadInterval', $config.reloadInterval)}
            class:border-blue-500={isDifferentFromDefault('reloadInterval', $config.reloadInterval)}
          />
        </div>
        
        <!-- Update Interval -->
        <div class="mb-4 grid grid-cols-2 gap-4 items-center">
          <label for="updateInterval" class="w-full text-left">
            {$translations.labelUpdateInterval || "Update Interval (seconds):"}
          </label>
          <input
            type="number"
            id="updateInterval"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            value={$config.updateInterval}
            on:input={(e) => handleConfigChange('updateInterval', parseInt(e.target.value))}
            min="1"
            class:border-green-500={!isDifferentFromDefault('updateInterval', $config.updateInterval)}
            class:border-blue-500={isDifferentFromDefault('updateInterval', $config.updateInterval)}
          />
        </div>
        
        <!-- Animation Speed -->
        <div class="mb-4 grid grid-cols-2 gap-4 items-center">
          <label for="animationSpeed" class="w-full text-left">
            {$translations.labelAnimationSpeed || "Animation Speed (milliseconds):"}
          </label>
          <input
            type="number"
            id="animationSpeed"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            value={$config.animationSpeed}
            on:input={(e) => handleConfigChange('animationSpeed', parseInt(e.target.value))}
            min="0"
            class:border-green-500={!isDifferentFromDefault('animationSpeed', $config.animationSpeed)}
            class:border-blue-500={isDifferentFromDefault('animationSpeed', $config.animationSpeed)}
          />
        </div>
        
        <!-- Initial Load Delay -->
        <div class="mb-4 grid grid-cols-2 gap-4 items-center">
          <label for="initialLoadDelay" class="w-full text-left">
            {$translations.labelInitialLoadDelay || "Initial Load Delay (milliseconds):"}
          </label>
          <input
            type="number"
            id="initialLoadDelay"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            value={$config.initialLoadDelay}
            on:input={(e) => handleConfigChange('initialLoadDelay', parseInt(e.target.value))}
            min="0"
            class:border-green-500={!isDifferentFromDefault('initialLoadDelay', $config.initialLoadDelay)}
            class:border-blue-500={isDifferentFromDefault('initialLoadDelay', $config.initialLoadDelay)}
          />
        </div>
      </div>
    {/if}
  </form>

  <hr class="my-6 border-gray-300" />

  <!-- JSON Output -->
  <div class="mb-4 grid grid-cols-2 gap-4 items-start">
    <label for="jsonOutput" class="w-full text-left">
      {$translations.labelJsonOutput || "Copy updated config.json content:"}
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