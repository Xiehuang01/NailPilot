import {createRouter, createWebHistory} from 'vue-router';
import ConsumerPage from '@/pages/ConsumerPage.vue';
import HomePage from '@/pages/HomePage.vue';
import MerchantPage from '@/pages/MerchantPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/consumer',
      name: 'consumer',
      component: ConsumerPage,
      meta: {requiredRole: 'consumer'},
    },
    {
      path: '/merchant',
      name: 'merchant',
      component: MerchantPage,
      meta: {requiredRole: 'merchant'},
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to) => {
  const requiredRole = to.meta.requiredRole as string | undefined;
  if (!requiredRole) {
    return true;
  }

  const role = localStorage.getItem('role');
  if (role !== requiredRole) {
    return '/';
  }

  return true;
});

export default router;
