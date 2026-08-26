import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@salao-abrasel/device-id";

function generateId(): string {
  // UUID v4 simples o bastante para identificar o device sem exigir login.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const generated = generateId();
  await AsyncStorage.setItem(STORAGE_KEY, generated);
  cachedDeviceId = generated;
  return generated;
}
