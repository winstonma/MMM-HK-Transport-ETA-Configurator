import { writable } from 'svelte/store';
import { dataService } from './dataService.js';

// Generic data loader with caching and loading states
export class DataLoader {
	constructor() {
		this.cache = new Map();
		this.loadingStates = new Map();
	}

	// Create a reactive store for data loading
	createDataStore(key, loadFunction) {
		const store = writable({ data: null, loading: false, error: null });

		const load = async (...args) => {
			const cacheKey = `${key}-${JSON.stringify(args)}`;

			// Return cached data if available
			if (this.cache.has(cacheKey)) {
				store.set({
					data: this.cache.get(cacheKey),
					loading: false,
					error: null,
				});
				return;
			}

			// Prevent duplicate loading
			if (this.loadingStates.has(cacheKey)) {
				return this.loadingStates.get(cacheKey);
			}

			store.update(state => ({ ...state, loading: true, error: null }));

			const loadPromise = (async () => {
				try {
					const data = await loadFunction(...args);
					this.cache.set(cacheKey, data);
					store.set({ data, loading: false, error: null });
					return data;
				} catch (error) {
					const errorMessage = error.message || 'Failed to load data';
					store.set({ data: null, loading: false, error: errorMessage });
					throw error;
				} finally {
					this.loadingStates.delete(cacheKey);
				}
			})();

			this.loadingStates.set(cacheKey, loadPromise);
			return loadPromise;
		};

		return { store, load };
	}

	// Convenience method for provider-specific data loading
	createProviderDataLoader(provider) {
		switch (provider) {
			case 'kmb':
				return this.createDataStore('kmb', () => dataService.loadKmbData());
			case 'ctb':
				return this.createDataStore('ctb', () => dataService.loadCtbData());
			case 'ctb-route-stops':
				return this.createDataStore('ctb-route-stops', route =>
					dataService.loadCtbRouteStopsData(route)
				);
			case 'mtrbus':
				return this.createDataStore('mtrbus', () =>
					dataService.loadMtrbusRoutesData()
				);
			case 'gmb':
				return this.createDataStore('gmb', () => dataService.loadGmbData());
			case 'gmb-routes':
				return this.createDataStore('gmb-routes', area =>
					dataService.loadGmbRoutesByArea(area)
				);
			case 'lrt':
				return this.createDataStore('lrt', () =>
					dataService.loadLrtStationsData()
				);
			case 'mtr':
				return this.createDataStore('mtr', () =>
					dataService.loadMtrLinesData()
				);
			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	}

	clearCache() {
		this.cache.clear();
		this.loadingStates.clear();
	}
}

// Export singleton instance
export const dataLoader = new DataLoader();
