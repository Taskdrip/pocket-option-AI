import axios from 'axios';

axios.defaults.baseURL = import.meta.env.BASE_URL?.replace(/\/$/, '') + '/api';

// Also intercept regular fetch if the generated client uses it
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('po_token');
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return originalFetch(input, init);
};

export default axios;
