const DB_NAME = 'wardrobeDB';
const DB_VERSION = 1;

const STORES = {
  DESIGNS: 'designs',
  ASSETS: 'assets',
  SNAPSHOTS: 'snapshots'
};

class IndexedDBStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.DESIGNS)) {
          db.createObjectStore(STORES.DESIGNS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ASSETS)) {
          db.createObjectStore(STORES.ASSETS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
          const snapshotsStore = db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'id' });
          snapshotsStore.createIndex('projectId', 'projectId', { unique: false });
          snapshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    await this.initPromise;
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Design methods
  async saveDesign(design) {
    const store = await this.getStore(STORES.DESIGNS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(design);
      request.onsuccess = () => resolve(design);
      request.onerror = () => reject(request.error);
    });
  }

  async getDesign(id) {
    const store = await this.getStore(STORES.DESIGNS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDesign(id) {
    const store = await this.getStore(STORES.DESIGNS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Asset methods
  async saveAsset(asset) {
    const store = await this.getStore(STORES.ASSETS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(asset);
      request.onsuccess = () => resolve(asset);
      request.onerror = () => reject(request.error);
    });
  }

  async getAsset(id) {
    const store = await this.getStore(STORES.ASSETS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAsset(id) {
    const store = await this.getStore(STORES.ASSETS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Snapshot methods
  async saveSnapshot(snapshot) {
    const store = await this.getStore(STORES.SNAPSHOTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...snapshot,
        timestamp: new Date().toISOString()
      });
      request.onsuccess = () => resolve(snapshot);
      request.onerror = () => reject(request.error);
    });
  }

  async getProjectSnapshots(projectId) {
    const store = await this.getStore(STORES.SNAPSHOTS);
    return new Promise((resolve, reject) => {
      const index = store.index('projectId');
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSnapshot(id) {
    const store = await this.getStore(STORES.SNAPSHOTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearStore(storeName) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    await Promise.all([
      this.clearStore(STORES.DESIGNS),
      this.clearStore(STORES.ASSETS),
      this.clearStore(STORES.SNAPSHOTS)
    ]);
  }
}

export const indexedDBStorage = new IndexedDBStorage();
export default indexedDBStorage; 