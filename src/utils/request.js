import axios from 'axios';
import { Message } from 'element-ui';
import store from '@/store';

// 创建一个axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 5000
});

// 请求拦截
service.interceptors.request.use(
  config => {
    config.data = JSON.stringify(config.data);
    config.headers['Content-Type'] = 'application/json';

    if (store.getters.token) {
      config.headers['X-Token'] = store.getters.token;
    }
    return config;
  },
  error => {
    console.log('接口请求报错', error);
    return Promise.reject(error);
  }
);

// 返回拦截
service.interceptors.response.use(
  response => {
    const res = response.data;

    if (res.code !== 200 && res.code !== 20000) {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      });
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      return res;
    }
  },
  error => {
    console.log('err' + error);
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;

export function get(url, params) {
  return service.get(url, { params: params });
}

export function post(url, params, config) {
  return service.post(url, params, config);
}

export function del(url) {
  return service.delete(url);
}
