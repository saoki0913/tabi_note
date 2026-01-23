import type { Trip } from "../types/trip";
import { getSupabaseClient } from "./supabaseClient";

const STORAGE_KEY = "tabiNote_trips";

type TripPayloadRow = {
  payload: Trip;
};

const getLocalTrips = (): Trip[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? (JSON.parse(data) as Trip[]) : [];
};

const saveLocalTrip = (trip: Trip) => {
  if (typeof window === "undefined") {
    return;
  }
  const stripDesignForLocal = (entry: Trip): Trip => {
    if (!entry.design) return entry;
    return {
      ...entry,
      design: {
        style: entry.design.style,
        assets: {},
        updatedAt: entry.design.updatedAt,
      },
    };
  };

  try {
    const trips = getLocalTrips().map(stripDesignForLocal);
    const nextTrip = stripDesignForLocal(trip);
    const index = trips.findIndex((item) => item.id === nextTrip.id);
    if (index >= 0) {
      trips[index] = nextTrip;
    } else {
      trips.push(nextTrip);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (error) {
    console.error("Failed to save trip locally:", error);
  }
};

const deleteLocalTrip = (id: string) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const trips = getLocalTrips();
    const filtered = trips.filter((trip) => trip.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete trip locally:", error);
  }
};

export const storage = {
  getTrips: async (): Promise<Trip[]> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalTrips();
    }

    const { data, error } = await supabase
      .from("trips")
      .select("payload")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load trips from Supabase:", error);
      return getLocalTrips();
    }

    return (data as TripPayloadRow[] | null)?.map((row) => row.payload) ?? [];
  },

  getTrip: async (id: string): Promise<Trip | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalTrips().find((trip) => trip.id === id) || null;
    }

    const { data, error } = await supabase
      .from("trips")
      .select("payload")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load trip from Supabase:", error);
      return getLocalTrips().find((trip) => trip.id === id) || null;
    }

    return (data as TripPayloadRow | null)?.payload ?? null;
  },

  saveTrip: async (trip: Trip): Promise<Trip> => {
    const supabase = getSupabaseClient();
    const createdAt = trip.createdAt || new Date().toISOString();
    const nextTrip = {
      ...trip,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (!supabase) {
      saveLocalTrip(nextTrip);
      return nextTrip;
    }

    const { data, error } = await supabase
      .from("trips")
      .upsert({
        id: nextTrip.id,
        payload: nextTrip,
        share_token: nextTrip.shareToken ?? null,
        created_at: nextTrip.createdAt,
        updated_at: nextTrip.updatedAt,
      })
      .select("payload")
      .single();

    if (error) {
      console.error("Failed to save trip to Supabase:", error);
      saveLocalTrip(nextTrip);
      return nextTrip;
    }

    return (data as TripPayloadRow | null)?.payload ?? nextTrip;
  },

  deleteTrip: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      deleteLocalTrip(id);
      return;
    }

    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete trip from Supabase:", error);
      deleteLocalTrip(id);
    }
  },

  getTripByShareToken: async (token: string): Promise<Trip | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getLocalTrips().find((trip) => trip.shareToken === token) || null;
    }

    const { data, error } = await supabase
      .from("trips")
      .select("payload")
      .eq("share_token", token)
      .maybeSingle();

    if (error) {
      console.error("Failed to load shared trip from Supabase:", error);
      return null;
    }

    return (data as TripPayloadRow | null)?.payload ?? null;
  },
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const generateShareToken = (): string => {
  return Math.random().toString(36).slice(2, 14);
};
