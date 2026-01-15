// Note here that most components shouldn't be using the raw set auth tokens -
// they should instead use the useAuthProcedures hook
export const get_auth_token = (): string | null => localStorage.getItem('authToken');

export const set_auth_token = (val: string): void => {
  localStorage.setItem('authToken', val);
};

export const clear_auth_tokens = (): void => {
  localStorage.removeItem('authToken');
};
