import { indexedDBStorage } from '../src/core/storage/indexedDB.js';

describe('IndexedDB Storage Tests', () => {
  beforeEach(async () => {
    await indexedDBStorage.clearAll();
  });

  afterAll(async () => {
    await indexedDBStorage.clearAll();
  });

  // Design tests
  describe('Design Operations', () => {
    const testDesign = {
      id: 'design1',
      name: 'Test Design',
      components: [
        { type: 'shelf', position: { x: 0, y: 0, z: 0 } }
      ]
    };

    test('should save and retrieve a design', async () => {
      await indexedDBStorage.saveDesign(testDesign);
      const retrieved = await indexedDBStorage.getDesign('design1');
      expect(retrieved).toEqual(testDesign);
    });

    test('should delete a design', async () => {
      await indexedDBStorage.saveDesign(testDesign);
      await indexedDBStorage.deleteDesign('design1');
      const retrieved = await indexedDBStorage.getDesign('design1');
      expect(retrieved).toBeUndefined();
    });
  });

  // Asset tests
  describe('Asset Operations', () => {
    const testAsset = {
      id: 'asset1',
      type: 'texture',
      data: new Uint8Array([1, 2, 3, 4])
    };

    test('should save and retrieve an asset', async () => {
      await indexedDBStorage.saveAsset(testAsset);
      const retrieved = await indexedDBStorage.getAsset('asset1');
      expect(retrieved).toEqual(testAsset);
    });

    test('should delete an asset', async () => {
      await indexedDBStorage.saveAsset(testAsset);
      await indexedDBStorage.deleteAsset('asset1');
      const retrieved = await indexedDBStorage.getAsset('asset1');
      expect(retrieved).toBeUndefined();
    });
  });

  // Snapshot tests
  describe('Snapshot Operations', () => {
    const testSnapshot = {
      id: 'snapshot1',
      projectId: 'project1',
      state: { components: [] }
    };

    test('should save and retrieve a snapshot', async () => {
      await indexedDBStorage.saveSnapshot(testSnapshot);
      const snapshots = await indexedDBStorage.getProjectSnapshots('project1');
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].id).toBe('snapshot1');
      expect(snapshots[0].projectId).toBe('project1');
      expect(snapshots[0].timestamp).toBeDefined();
    });

    test('should retrieve multiple snapshots for a project', async () => {
      const snapshot1 = { ...testSnapshot, id: 'snapshot1' };
      const snapshot2 = { ...testSnapshot, id: 'snapshot2' };
      
      await indexedDBStorage.saveSnapshot(snapshot1);
      await indexedDBStorage.saveSnapshot(snapshot2);
      
      const snapshots = await indexedDBStorage.getProjectSnapshots('project1');
      expect(snapshots.length).toBe(2);
      expect(snapshots.map(s => s.id)).toEqual(['snapshot1', 'snapshot2']);
    });

    test('should delete a snapshot', async () => {
      await indexedDBStorage.saveSnapshot(testSnapshot);
      await indexedDBStorage.deleteSnapshot('snapshot1');
      const snapshots = await indexedDBStorage.getProjectSnapshots('project1');
      expect(snapshots.length).toBe(0);
    });
  });

  // Utility tests
  describe('Utility Operations', () => {
    test('should clear all stores', async () => {
      const design = { id: 'design1', name: 'Test' };
      const asset = { id: 'asset1', type: 'texture' };
      const snapshot = { id: 'snapshot1', projectId: 'project1' };

      await indexedDBStorage.saveDesign(design);
      await indexedDBStorage.saveAsset(asset);
      await indexedDBStorage.saveSnapshot(snapshot);

      await indexedDBStorage.clearAll();

      const retrievedDesign = await indexedDBStorage.getDesign('design1');
      const retrievedAsset = await indexedDBStorage.getAsset('asset1');
      const retrievedSnapshots = await indexedDBStorage.getProjectSnapshots('project1');

      expect(retrievedDesign).toBeUndefined();
      expect(retrievedAsset).toBeUndefined();
      expect(retrievedSnapshots.length).toBe(0);
    });
  });
}); 