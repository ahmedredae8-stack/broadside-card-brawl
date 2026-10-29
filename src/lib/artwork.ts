import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ArtworkPose = {
  id: string;
  category: "ship" | "rocket" | "background" | "store";
  subject: string;
  pose: "idle" | "cast" | "submerged" | "haul" | "flight" | "explosion" | "fire" | "smoke" | "fade" | "day" | "night";
  image_path: string;
  created_by: string;
};

export async function isArtworkAdmin() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase.from("user_roles").select("id").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
  return Boolean(data);
}

export async function listArtwork() {
  const { data, error } = await supabase.from("artwork_poses").select("id,category,subject,pose,image_path,created_by").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ArtworkPose[];
}

export async function artworkUrl(path: string) {
  const { data, error } = await supabase.storage.from("game-artwork").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/** Map of "<itemKey>:<pose>" → signed image URL for admin-published art. */
export const ARTWORK_UPDATED = "island-bay:artwork-updated";

export function useArtworkMap() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const rows = await listArtwork();
        const entries: [string, string][] = [];
        for (const row of rows) {
          const key = `${row.subject}:${row.pose}`;
          if (entries.some(([k]) => k === key)) continue; // newest wins
          const url = await artworkUrl(row.image_path).catch(() => "");
          if (url) entries.push([key, url]);
        }
        if (alive) setMap(Object.fromEntries(entries));
      } catch { /* fall back to bundled art */ }
    };
    void refresh();
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(ARTWORK_UPDATED) : null;
    if (channel) channel.onmessage = () => void refresh();
    const live = supabase.channel(`artwork-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "artwork_poses" }, () => void refresh())
      .subscribe();
    window.addEventListener(ARTWORK_UPDATED, refresh);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 180_000);
    return () => {
      alive = false;
      channel?.close();
      void supabase.removeChannel(live);
      window.removeEventListener(ARTWORK_UPDATED, refresh);
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, []);
  return map;
}
/** Tell every open tab and the current page that admin artwork changed. */
export function announceArtworkUpdate() {
  window.dispatchEvent(new Event(ARTWORK_UPDATED));
  if (typeof BroadcastChannel !== "undefined") { const c = new BroadcastChannel(ARTWORK_UPDATED); c.postMessage(Date.now()); c.close(); }
}

export const isVideoPath = (path: string) => /\.(mp4|webm)$/i.test(path);

/** Newest admin-uploaded sea background (image or looping video), if any. */
export function useSeaBackground() {
  const [bg, setBg] = useState<{ url: string; video: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const row = (await listArtwork()).find((r) => r.category === "background");
        if (!row) { if (alive) setBg(null); return; }
        const url = await artworkUrl(row.image_path);
        if (alive) setBg({ url, video: isVideoPath(row.image_path) });
      } catch { /* keep bundled background */ }
    };
    void refresh();
    window.addEventListener(ARTWORK_UPDATED, refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(ARTWORK_UPDATED) : null;
    if (channel) channel.onmessage = () => void refresh();
    return () => { alive = false; channel?.close(); window.removeEventListener(ARTWORK_UPDATED, refresh); };
  }, []);
  return bg;
}
