// Simple JWT auth functions
export function login() {
  // JWT auth is handled through the login form
  console.log('Login through JWT form');
}

export function logout() {
  // Clear JWT token from localStorage
  localStorage.removeItem('token');
  window.location.href = '/';
}

export function handleRedirect() {
  // No redirect handling needed for JWT auth
  return Promise.resolve(null);
}