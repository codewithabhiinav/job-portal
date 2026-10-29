// Keys
const USER_KEY = 'careernest_temp_user';
const APPS_KEY = 'careernest_temp_applications';

// 1. User Session Helpers
export const saveUserSession = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserSession = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(APPS_KEY);
};

// 2. Application Submissions (Shared across all tabs, no DB or Cloudinary needed)
export const getApplications = () => {
  try {
    const apps = localStorage.getItem(APPS_KEY);
    return apps ? JSON.parse(apps) : [];
  } catch {
    return [];
  }
};

export const addApplication = (application) => {
  const current = getApplications();
  const updated = [application, ...current];
  localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  // Notify other tabs and components immediately
  window.dispatchEvent(new Event('session_applications_updated'));
  return updated;
};

export const updateApplicationStatusInSession = (id, newStatus) => {
  const current = getApplications();
  const updated = current.map((app) =>
    (app._id === id || app.id === id) ? { ...app, status: newStatus } : app
  );
  localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('session_applications_updated'));
  return updated;
};