"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { axiosFetchPatient } from "@/lib/axiosConfig";

export interface Profile {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  gender?: string;
  relation: string;
  allergies?: string | null;
  bloodGroup?: string | null;
}

interface ProfileContextShape {
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  setActiveProfileId: (id: string) => void;
  reload: () => Promise<void>;
  loaded: boolean;
}

const ProfileContext = createContext<ProfileContextShape>({
  profiles: [],
  activeProfileId: null,
  activeProfile: null,
  setActiveProfileId: () => {},
  reload: async () => {},
  loaded: false,
});

const STORAGE_KEY = "activeProfileId";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await axiosFetchPatient().get("/profiles");
      const list: Profile[] = Array.isArray(res.data) ? res.data : [];
      setProfiles(list);
      // Resolve which profile is active: the one in localStorage if it still exists,
      // otherwise the "self" profile, otherwise the first one.
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const matchStored = stored ? list.find((p) => p.id === stored) : undefined;
      const self = list.find((p) => p.relation === "self");
      const chosen = matchStored?.id || self?.id || list[0]?.id || null;
      if (chosen && chosen !== stored && typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, chosen);
      }
      setActiveProfileIdState(chosen);
    } catch {
      // 401/403 means the user isn't logged in as a patient — silently ignore.
      setProfiles([]);
      setActiveProfileIdState(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Only load profiles for patients. Avoids a 403 spam when a doctor is logged in.
    if (typeof window === "undefined") return;
    if (localStorage.getItem("role") !== "patient") {
      setLoaded(true);
      return;
    }
    reload();
  }, [reload]);

  const setActiveProfileId = (id: string) => {
    setActiveProfileIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  return (
    <ProfileContext.Provider
      value={{ profiles, activeProfileId, activeProfile, setActiveProfileId, reload, loaded }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
