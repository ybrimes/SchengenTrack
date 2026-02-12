import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Trip, SchengenCountry } from '../types';

const STORAGE_KEY = 'schengentrack_trips';

interface TripStore {
  trips: Trip[];
  isLoaded: boolean;

  loadTrips: () => Promise<void>;
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trip>;
  updateTrip: (id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  clearAllTrips: () => Promise<void>;
  getTrip: (id: string) => Trip | undefined;
}

async function persistTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  isLoaded: false,

  loadTrips: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const trips: Trip[] = data ? JSON.parse(data) : [];
      set({ trips, isLoaded: true });
    } catch {
      set({ trips: [], isLoaded: true });
    }
  },

  addTrip: async (tripData) => {
    const now = new Date().toISOString();
    const newTrip: Trip = {
      ...tripData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const updatedTrips = [...get().trips, newTrip].sort(
      (a, b) => a.entryDate.localeCompare(b.entryDate)
    );
    set({ trips: updatedTrips });
    await persistTrips(updatedTrips);
    return newTrip;
  },

  updateTrip: async (id, updates) => {
    const updatedTrips = get().trips.map((trip) =>
      trip.id === id
        ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
        : trip
    );
    set({ trips: updatedTrips });
    await persistTrips(updatedTrips);
  },

  deleteTrip: async (id) => {
    const updatedTrips = get().trips.filter((trip) => trip.id !== id);
    set({ trips: updatedTrips });
    await persistTrips(updatedTrips);
  },

  clearAllTrips: async () => {
    set({ trips: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  getTrip: (id) => {
    return get().trips.find((trip) => trip.id === id);
  },
}));
