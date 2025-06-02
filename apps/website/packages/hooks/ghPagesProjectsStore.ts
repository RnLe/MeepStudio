// This file is now deprecated. Use useMeepProjects and useProjectsStore from '../stores/projects'.
// Only re-export the new store and service for backward compatibility.
export { useProjectsStore as useGhPagesProjectsStore } from '../stores/projects';
export { createLocalStorageService as ghPagesSvc } from '../services/projectService';
