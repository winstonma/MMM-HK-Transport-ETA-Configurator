// Helper functions for config form management

export function createOption(value, text, title = null) {
	return { value, text, title };
}

export function sortRoutes(routes) {
	return routes.sort((a, b) =>
		a.toString().localeCompare(b.toString(), undefined, { numeric: true })
	);
}

export function parseStationId(sta, separator = '-') {
	return sta ? sta.split(separator) : [];
}

export function buildStationId(parts, separator = '-') {
	return parts.filter(Boolean).join(separator);
}

export function findValidSelection(options, currentValue) {
	if (!options.length) return '';
	if (currentValue && options.some(opt => opt.value === currentValue)) {
		return currentValue;
	}
	return options[0].value;
}

export function resetDependentSelections(selections, fieldId, dependentFields) {
	const newSelections = { ...selections };
	dependentFields.forEach(field => {
		newSelections[field] = '';
	});
	return newSelections;
}

// Common field configurations
export const commonFieldTypes = {
	route: {
		id: 'route',
		labelKey: 'labelRoute',
		label: 'Route:',
		placeholder: '-- Select Route --',
	},
	direction: {
		id: 'direction',
		labelKey: 'labelDirection',
		label: 'Direction:',
		placeholder: '-- Select Direction --',
	},
	stop: {
		id: 'stop',
		labelKey: 'labelStop',
		label: 'Stop:',
		placeholder: '-- Select Stop --',
	},
	line: {
		id: 'line',
		labelKey: 'labelLine',
		label: 'Line:',
		placeholder: '-- Select Line --',
	},
	station: {
		id: 'station',
		labelKey: 'labelStation',
		label: 'Station:',
		placeholder: '-- Select Station --',
	},
};
