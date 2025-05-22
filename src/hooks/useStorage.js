import { useCallback } from 'react';
import { indexedDBStorage } from '../core/storage/indexedDB';

export const useStorage = () => {
  const saveProject = useCallback(async (projectData) => {
    try {
      await indexedDBStorage.saveDesign({
        ...projectData,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }, []);

  const loadProject = useCallback(async (projectId) => {
    try {
      const project = await indexedDBStorage.getDesign(projectId);
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }, []);

  const saveSnapshot = useCallback(async (projectId, snapshotData) => {
    try {
      await indexedDBStorage.saveSnapshot({
        projectId,
        state: snapshotData,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      return false;
    }
  }, []);

  const loadSnapshots = useCallback(async (projectId) => {
    try {
      const snapshots = await indexedDBStorage.getProjectSnapshots(projectId);
      return snapshots;
    } catch (error) {
      console.error('Failed to load snapshots:', error);
      return [];
    }
  }, []);

  const saveAsset = useCallback(async (assetData) => {
    try {
      await indexedDBStorage.saveAsset(assetData);
      return true;
    } catch (error) {
      console.error('Failed to save asset:', error);
      return false;
    }
  }, []);

  const loadAsset = useCallback(async (assetId) => {
    try {
      const asset = await indexedDBStorage.getAsset(assetId);
      return asset;
    } catch (error) {
      console.error('Failed to load asset:', error);
      return null;
    }
  }, []);

  return {
    saveProject,
    loadProject,
    saveSnapshot,
    loadSnapshots,
    saveAsset,
    loadAsset
  };
};

export default useStorage; 