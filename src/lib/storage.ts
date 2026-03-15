import type { Trip } from "../types/trip";
import { generateId } from "./ids";

const STORAGE_KEY = "tabiNote_trips";

const normalizeTrip = (trip: Trip): Trip => {
  const formatType = trip.formatType ?? "classic";
  return {
    ...trip,
    formatType,
    design: trip.design
      ? {
          ...trip.design,
          format: trip.design.format ?? formatType,
          renderMode: "full",
        }
      : trip.design,
  };
};

const getLocalTrips = (): Trip[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? (JSON.parse(raw) as Trip[]) : [];
  return parsed.map(normalizeTrip);
};

const writeTrips = (trips: Trip[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
};

export const storage = {
  getTrips: async (): Promise<Trip[]> => getLocalTrips(),

  getTrip: async (id: string): Promise<Trip | null> =>
    getLocalTrips().find((trip) => trip.id === id) ?? null,

  saveTrip: async (trip: Trip): Promise<Trip> => {
    const nextTrip = normalizeTrip({
      ...trip,
      createdAt: trip.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const trips = getLocalTrips();
    const index = trips.findIndex((item) => item.id === nextTrip.id);
    if (index >= 0) {
      trips[index] = nextTrip;
    } else {
      trips.unshift(nextTrip);
    }
    writeTrips(trips);
    return nextTrip;
  },

  deleteTrip: async (id: string): Promise<void> => {
    writeTrips(getLocalTrips().filter((trip) => trip.id !== id));
  },

  getTripByShareToken: async (token: string): Promise<Trip | null> =>
    getLocalTrips().find((trip) => trip.shareToken === token) ?? null,
};

export { generateId };

export const generateShareToken = (): string => {
  return Math.random().toString(36).slice(2, 14);
};
