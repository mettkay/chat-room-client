import axios from 'axios'

const http = axios.create({
  // baseURL: 'http://2d08147a.vip.cpolar.cn',
  baseURL: 'http://127.0.0.1:3007',
  timeout: 30000, 
  withCredentials: true
})


// 请求拦截器，设置token
http.interceptors.request.use(config => {
  return config
}, error => {
  console.log(error)
  return Promise.reject(error)
})

// 响应拦截器
http.interceptors.response.use(response => {
  if (response.status === 200) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(response)
  }
})


export default http