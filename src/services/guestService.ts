import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_KEY = "guestCreatedAt";
const DAY_MS = 24 * 60 * 60 * 1000;

/* Save guest start date (only once) */
export async function setGuestStartIfMissing() {
  const existing = await AsyncStorage.getItem(GUEST_KEY);
  if (!existing) {
    await AsyncStorage.setItem(GUEST_KEY, Date.now().toString());
  }
}

/* Check if guest expired */
export async function isGuestExpired(days = 15): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_KEY);
  if (!value) return false;

  const createdAt = Number(value);
  return Date.now() - createdAt > days * DAY_MS;
}

/* Clear guest data */
export async function clearGuestData() {
  await AsyncStorage.removeItem(GUEST_KEY);
}
