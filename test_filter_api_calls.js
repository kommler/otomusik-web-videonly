// Test script to verify API call generation
console.log('Testing API call generation with filters...');

// Simulate the buildQueryString function from client.ts
function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Test with status filters
const testFilters = {
  status: ['PENDING', 'ERROR', 'FAILED'],
  limit: 50,
  sort_by: 'updated_at',
  sort_order: 'desc'
};

const queryString = buildQueryString(testFilters);
console.log('Generated query string:', queryString);
console.log('Full URL would be: /api/video/videos/' + queryString);

// Test with empty status array
const testFilters2 = {
  status: [],
  limit: 50
};

const queryString2 = buildQueryString(testFilters2);
console.log('With empty status array:', queryString2);

// Test with single status
const testFilters3 = {
  status: ['PENDING'],
  limit: 50
};

const queryString3 = buildQueryString(testFilters3);
console.log('With single status:', queryString3);