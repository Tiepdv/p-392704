
export interface FilterItem {
  column: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR'; // How this filter connects to the previous one
}

export const matchFilter = (item: any, filter: FilterItem) => {
  const value = String(item[filter.column] || '').toLowerCase();
  const filterValue = filter.value.toLowerCase();
  switch (filter.operator) {
    case 'equals': return value === filterValue;
    case 'not-equals': return value !== filterValue;
    case 'contains': return value.includes(filterValue);
    case 'greater-than': return Number(value) > Number(filterValue);
    case 'less-than': return Number(value) < Number(filterValue);
    default: return true;
  }
};

export const applyFiltersWithLogic = (
  data: any[],
  filters: FilterItem[],
  _logic?: 'AND' | 'OR' // kept for backward compat, ignored
) => {
  if (!filters.length) return data;
  return data.filter(item => {
    // Evaluate left-to-right with per-filter logic connectors
    let result = matchFilter(item, filters[0]);
    for (let i = 1; i < filters.length; i++) {
      const connector = filters[i].logic || 'AND';
      const current = matchFilter(item, filters[i]);
      if (connector === 'AND') {
        result = result && current;
      } else {
        result = result || current;
      }
    }
    return result;
  });
};
