import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

export const analyzeText = (text, url) =>
  API.post('/analyze', { text, url });

export const getHistory = () =>
  API.get('/history');

export default API;