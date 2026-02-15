
export const matchFilter = (item: any, filter: { column: string; operator: string; value: string }) => {
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
  filters: Array<{ column: string; operator: string; value: string }>,
  logic: 'AND' | 'OR' = 'AND'
) => {
  if (!filters.length) return data;
  return data.filter(item => {
    if (logic === 'AND') {
      return filters.every(filter => matchFilter(item, filter));
    } else {
      return filters.some(filter => matchFilter(item, filter));
    }
  });
};
