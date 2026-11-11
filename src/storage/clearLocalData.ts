import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueueStorageMutation } from "./storageMutationQueue";
import {
  clearRecommendationStateInQueue,
  RECOMMENDATION_STATE_KEY,
  type RecommendationStorage,
} from "./quoteRotation";

const ECHO_STORAGE_PREFIX = "@echo/";

export type EchoStorage = {
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
} & Pick<RecommendationStorage, "getItem" | "setItem">;

/** Clears only ECHO's local storage namespace, leaving other app data intact. */
export function clearLocalData(
  storage: EchoStorage = AsyncStorage,
): Promise<void> {
  return enqueueStorageMutation(async () => {
    await clearRecommendationStateInQueue(storage);
    const keys = await storage.getAllKeys();
    const echoKeys = keys.filter(
      (key) =>
        key.startsWith(ECHO_STORAGE_PREFIX) && key !== RECOMMENDATION_STATE_KEY,
    );
    if (echoKeys.length > 0) {
      await storage.multiRemove(echoKeys);
    }
  });
}
