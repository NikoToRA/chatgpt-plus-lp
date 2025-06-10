class AuthService {
  async login() {
    // TODO: Implement simple auth or Supabase auth
    localStorage.setItem('authToken', 'temp-token');
    return true;
  }

  async logout() {
    localStorage.removeItem('authToken');
  }

  isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
  }

  getAccount() {
    return { name: 'Admin User', email: 'admin@example.com' };
  }
}

export const authService = new AuthService();
export default authService;