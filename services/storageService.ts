
import { Project, User } from '../types';

const KEYS = {
  USERS: 'graphico_users_db',
  CURRENT_SESSION: 'graphico_session',
  PROJECTS_PREFIX: 'graphico_projects_'
};

// --- User Management ---

export const getRegisteredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const registerUser = (user: User): User => {
  const users = getRegisteredUsers();
  // Check if exists
  const existing = users.find(u => u.email === user.email);
  if (existing) return existing;
  
  const updatedUsers = [...users, user];
  localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
  return user;
};

export const loginUser = (email: string): User | null => {
  const users = getRegisteredUsers();
  return users.find(u => u.email === email) || null;
};

export const saveSession = (user: User) => {
  localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(user));
};

export const getSession = (): User | null => {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(KEYS.CURRENT_SESSION);
};

// --- Project Management (Per User) ---

export const getUserProjects = (userEmail: string): Project[] => {
  try {
    const key = `${KEYS.PROJECTS_PREFIX}${userEmail}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveUserProjects = (userEmail: string, projects: Project[]) => {
  const key = `${KEYS.PROJECTS_PREFIX}${userEmail}`;
  localStorage.setItem(key, JSON.stringify(projects));
};
