// Simple auth placeholder - Firebase removed
export function login() {
  // Redirect to backend login endpoint
  window.location.href = '/api/login';
}

export function logout() {
  // Redirect to backend logout endpoint
  window.location.href = '/api/logout';
}

export function handleRedirect() {
  // No redirect handling needed for simple auth
  return Promise.resolve(null);
}