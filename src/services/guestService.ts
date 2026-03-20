import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_KEY = "guestCreatedAt";
const DAY_MS = 24 * 60 * 60 * 1000;

export async function setGuestStartIfMissing(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(GUEST_KEY);
    if (!existing) {
      await AsyncStorage.setItem(GUEST_KEY, Date.now().toString());
    }
  } catch (error) {
    console.error("Error setting guest start time:", error);
  }
}

export async function isGuestExpired(days = 15): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(GUEST_KEY);
    if (!value) return false;

    const createdAt = Number(value);
    if (Number.isNaN(createdAt)) return false;

    return Date.now() - createdAt > days * DAY_MS;
  } catch (error) {
    console.error("Error checking guest expiration:", error);
    return false;
  }
}

export async function clearGuestData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_KEY);
  } catch (error) {
    console.error("Error clearing guest data:", error);
  }
}