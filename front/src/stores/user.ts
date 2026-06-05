import {computed, ref} from 'vue';
import {defineStore} from 'pinia';

export type UserRole = 'consumer' | 'merchant' | null;

export type Preference = {
  scene: string;
  budget: string;
  style: string;
};

export const useUserStore = defineStore('user', () => {
  const role = ref<UserRole>((localStorage.getItem('role') as UserRole) || null);
  const sessionId = ref<string | null>(localStorage.getItem('sessionId'));
  const demoUserId = ref<string | null>(localStorage.getItem('demoUserId'));
  const nickname = ref<string | null>(localStorage.getItem('nickname'));
  const preferences = ref<Preference>({
    scene: '',
    budget: '',
    style: '',
  });

  const roleLabel = computed(() =>
    role.value === 'consumer' ? '消费者入口' : role.value === 'merchant' ? '商家智能控制台' : '',
  );

  const loginAs = (nextRole: Exclude<UserRole, null>, nextNickname = 'DemoUser') => {
    const nextSessionId = crypto.randomUUID();
    const nextDemoUserId = nextRole === 'consumer' ? 'demo_user_001' : 'demo_merchant_001';

    localStorage.setItem('role', nextRole);
    localStorage.setItem('sessionId', nextSessionId);
    localStorage.setItem('demoUserId', nextDemoUserId);
    localStorage.setItem('nickname', nextNickname);

    role.value = nextRole;
    sessionId.value = nextSessionId;
    demoUserId.value = nextDemoUserId;
    nickname.value = nextNickname;
  };

  const setPreferences = (pref: Partial<Preference>) => {
    preferences.value = {...preferences.value, ...pref};
  };

  const logout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('demoUserId');
    localStorage.removeItem('nickname');

    role.value = null;
    sessionId.value = null;
    demoUserId.value = null;
    nickname.value = null;
  };

  return {
    demoUserId,
    loginAs,
    logout,
    nickname,
    preferences,
    role,
    roleLabel,
    sessionId,
    setPreferences,
  };
});
