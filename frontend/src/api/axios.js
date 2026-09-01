import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pingtalk-production.up.railway.app/api',
  withCredentials: true,
});

export default api;