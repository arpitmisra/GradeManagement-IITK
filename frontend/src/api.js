import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
 async config => {
   const response = await fetch('http://localhost:8000/api/csrf/', {
     credentials: 'include',
   });
   const data = await response.json();
   config.headers['X-CSRFToken'] = data.csrfToken;
   return config;
 },
 error => Promise.reject(error)
);

export default api;