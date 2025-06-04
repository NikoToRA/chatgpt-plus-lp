import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
    authority: `https://${process.env.REACT_APP_AZURE_TENANT_NAME}.b2clogin.com/${process.env.REACT_APP_AZURE_TENANT_NAME}.onmicrosoft.com/B2C_1_signupsignin`,
    redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const loginRequest = {
  scopes: ['openid', 'profile'],
};

class AuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async initialize() {
    await this.msalInstance.initialize();
  }

  async login() {
    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      if (response && response.idToken) {
        localStorage.setItem('authToken', response.idToken);
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    localStorage.removeItem('authToken');
    await this.msalInstance.logoutPopup();
  }

  async getToken() {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const request = {
      ...loginRequest,
      account: accounts[0],
    };

    try {
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.idToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await this.msalInstance.acquireTokenPopup(request);
        return response.idToken;
      }
      throw error;
    }
  }

  isAuthenticated() {
    return this.msalInstance.getAllAccounts().length > 0;
  }

  getAccount() {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }
}

export const authService = new AuthService();
export default authService;