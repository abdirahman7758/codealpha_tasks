/**
 * Velarina Atelier Authentication Manager
 */

const Auth = {
  TOKEN_KEY: 'velarina_token',
  USER_KEY: 'velarina_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setSession(user, token) {
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateHeader();
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateHeader();
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  async logout() {
    try {
      await API.logout();
    } catch (e) {
      // Continue client cleanup
    }
    this.clearSession();
    window.location.href = '/index.html';
  },

  updateHeader() {
    const user = this.getUser();
    const accountLinks = document.querySelectorAll('.header-account-link');
    accountLinks.forEach(link => {
      if (user && user.firstName) {
        link.setAttribute('href', '/account.html');
        link.setAttribute('title', `Account: ${user.firstName} ${user.lastName}`);
      } else {
        link.setAttribute('href', '/auth.html');
        link.setAttribute('title', 'Sign In or Register');
      }
    });
  }
};

window.Auth = Auth;

