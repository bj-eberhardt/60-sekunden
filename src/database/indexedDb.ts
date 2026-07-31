const databaseName = 'sixty-seconds';
const databaseVersion = 1;

export const catalogStoreName = 'catalog';
export const gameStateStoreName = 'gameState';

export function openAppDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(catalogStoreName)) {
        database.createObjectStore(catalogStoreName);
      }

      if (!database.objectStoreNames.contains(gameStateStoreName)) {
        database.createObjectStore(gameStateStoreName);
      }
    };
  });
}

export async function readStoreValue<T>(storeName: string, key: string) {
  const database = await openAppDatabase();

  try {
    return await requestToPromise<T | undefined>(
      database.transaction(storeName, 'readonly').objectStore(storeName).get(key),
    );
  } finally {
    database.close();
  }
}

export async function writeStoreValue<T>(storeName: string, key: string, value: T) {
  const database = await openAppDatabase();

  try {
    await requestToPromise(
      database.transaction(storeName, 'readwrite').objectStore(storeName).put(value, key),
    );
  } finally {
    database.close();
  }
}

export async function deleteStoreValue(storeName: string, key: string) {
  const database = await openAppDatabase();

  try {
    await requestToPromise(
      database.transaction(storeName, 'readwrite').objectStore(storeName).delete(key),
    );
  } finally {
    database.close();
  }
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
