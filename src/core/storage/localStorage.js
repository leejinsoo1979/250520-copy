const PREFIX = 'wardrobe_';

export const storage = {
  set: (key, value) => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(`${PREFIX}${key}`, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const serializedValue = localStorage.getItem(`${PREFIX}${key}`);
      if (serializedValue === null) {
        return defaultValue;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Project specific methods
  saveProject: (project) => {
    storage.set(`project_${project.id}`, project);
  },

  getProject: (projectId) => {
    return storage.get(`project_${projectId}`);
  },

  removeProject: (projectId) => {
    storage.remove(`project_${projectId}`);
  },

  // User preferences
  savePreferences: (preferences) => {
    storage.set('preferences', preferences);
  },

  getPreferences: () => {
    return storage.get('preferences', {
      theme: 'light',
      language: 'ko',
      notifications: true,
    });
  },

  // Recent projects
  addRecentProject: (projectId) => {
    const recentProjects = storage.get('recent_projects', []);
    const updatedProjects = [
      projectId,
      ...recentProjects.filter(id => id !== projectId)
    ].slice(0, 10); // Keep only last 10 projects
    storage.set('recent_projects', updatedProjects);
  },

  getRecentProjects: () => {
    return storage.get('recent_projects', []);
  },
};

export default storage; 