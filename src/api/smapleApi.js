import { del, get, post } from '@/utils/request';

export function getMethod(params) {
  return get('/url', params);
}

export function postMethod(params) {
  return post('/url', params);
}

export function delMethod(params) {
  return del(`/url/${params}`);
}
