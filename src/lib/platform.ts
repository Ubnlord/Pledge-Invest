import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xypcqtqmekrjgytivmsm.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Rx1WAH_4paQYPOTP1XeEPA_YTnX8yMM';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type ApiResponse<T = any> = { data: T };
async function request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/pledge-api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data?.error || `Request failed (${response.status})`);
    error.response = { data, status: response.status };
    throw error;
  }
  return { data };
}

export const api = {
  get: <T = any>(path: string) => request<T>('GET', path),
  post: <T = any>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T = any>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};

function normalizeUser(user: any) {
  if (!user) return null;
  return { ...user, userId: user.id, name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '', email: user.email || '' };
}
export const auth = {
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error && error.message !== 'Auth session missing!') throw error;
    return normalizeUser(data?.user);
  },
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return { user: normalizeUser(data.user) };
  },
  async signUp(input: { email: string; password: string; username: string; fullName: string; phone: string; country: string; referralCode?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          username: input.username.trim(),
          full_name: input.fullName.trim(),
          name: input.fullName.trim(),
          phone: input.phone.trim(),
          country: input.country,
          referral_code: input.referralCode?.trim().toUpperCase() || '',
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return { user: normalizeUser(data.user), session: data.session };
  },
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) throw error;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  isSignedIn() {
    return Boolean(localStorage.getItem('sb-xypcqtqmekrjgytivmsm-auth-token'));
  },
};
export const notifications = {
  async subscribe() {
    if (!('Notification' in window)) throw new Error('Browser notifications are not supported');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission denied');
    return { success: true };
  },
};
