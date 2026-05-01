import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
console.log('Current API Base URL:', baseURL);

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Catch "False Successes" where the server returns index.html instead of JSON
client.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'];
    if (contentType && typeof contentType === 'string' && contentType.includes('text/html')) {
      return Promise.reject({
        message: 'Received HTML instead of JSON. Check your API URL.',
        response: response
      });
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default client;
