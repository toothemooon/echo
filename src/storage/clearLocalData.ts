import AsyncStorage from "@react-native-async-storage/async-storage";

const ECHO_STORAGE_PREFIX = "@echo/";

/** Clears only ECHO's local storage namespace, leaving other app data intact. */
export async function clearLocalData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const echoKeys = keys.filter((key) => key.startsWith(ECHO_STORAGE_PREFIX));
  if (echoKeys.length > 0) {
    await AsyncStorage.multiRemove(echoKeys);
  }
}
