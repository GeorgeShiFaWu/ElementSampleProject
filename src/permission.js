import router from './router';
import store from './store';
import { Message } from 'element-ui';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import { getToken } from '@/utils/auth'; // get token from cookie
import getPageTitle from '@/utils/get-page-title';
import axios from 'axios';

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const whiteList = ['/login', '/auth-redirect']; // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start();

  // set page title
  document.title = getPageTitle(to.meta.title);

  // determine whether the user has logged in
  const hasToken = getToken();

  // 如果没有username，则登陆.
  if (!store.state.user.username) {
    login(to, from, next);
  } else {
    if (to.matched.length === 0) {
      console.log('loading to incorrent page!');
      next('/404');
    }
    next();
  }

  // 下面的可以不要了，根据项目定
  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' });
      NProgress.done(); // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = store.getters.roles && store.getters.roles.length > 0;
      if (hasRoles) {
        next();
      } else {
        try {
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
          const { roles } = await store.dispatch('user/getInfo');

          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch('permission/generateRoutes', roles);

          // dynamically add accessible routes
          router.addRoutes(accessRoutes);

          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true });
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken');
          Message.error(error || 'Has Error');
          next(`/login?redirect=${to.path}`);
          NProgress.done();
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next();
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`);
      NProgress.done();
    }
  }
});

router.afterEach(() => {
  // finish progress bar
  NProgress.done();
});

function login(to, from, next) {
  const uri = 'login';
  const url = window.location.href;
  axios.defaults.baseURL = process.env.VUE_APP_BASE_API;
  axios.get(uri, {
    withCredentials: true,
    timeout: 1000 * 3,
    headers: { 'originUrl': url }}).then(function(response) {
    if (response.data.code === 200 && response.data) {
      const data = response.data.data;
      store.state.token = data.token;
      store.state.user.root = data.root;
      store.state.user.username = data.user.username;
      next({ path: to.path, query: to.query });
    } else {
      window.location.href = response.data.redirectUrl;
    }
  }).catch(function(error) {
    console.log('ERROR:' + error);
  });
}
