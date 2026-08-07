// src/api/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
})

// Auto logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  }
)

export default api
