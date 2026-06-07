export const setAuthToken = (token: string, user: any) => {
  localStorage.setItem('apt_token', token);
  localStorage.setItem('apt_user', JSON.stringify(user));
};

export const getAuthToken = () => {
  return localStorage.getItem('apt_token');
};

export const getAuthUser = () => {
  const userStr = localStorage.getItem('apt_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem('apt_token');
  localStorage.removeItem('apt_user');
};
