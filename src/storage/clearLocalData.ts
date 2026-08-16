import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueueStorageMutation } from "./storageMutationQueue";

const ECHO_STORAGE_PREFIX = "@echo/";

export type EchoStorage = {
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
};

/** Clears only ECHO's local storage namespace, leaving other app data intact. */
export function clearLocalData(
  storage: EchoStorage = AsyncStorage,
): Promise<void> {
  return enqueueStorageMutation(async () => {
    const keys = await storage.getAllKeys();
    const echoKeys = keys.filter((key) => key.startsWith(ECHO_STORAGE_PREFIX));
    if (echoKeys.length > 0) {
      await storage.multiRemove(echoKeys);
    }
  });
}
