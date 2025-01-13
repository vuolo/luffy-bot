export type SearchResultTrack = {
  title: string; // -> "Chill Bae"
  identifier: string; // -> "https://soundcloud.com/liluzivert/chill-bae"
  duration: number; // -> 138371
  live: boolean; // -> false
  author: string; // -> "Lil Uzi Vert"
  thumbnail: string | null; // -> null
  thumbnailSmall: string | null; // -> null
  sponsor: string | null; // -> null
};

export type SearchResultTrackList = SearchResultTrack[];

export type TrackDetails = {
  id: string; // -> "2825414220403411998"
  title: string; // -> "Chill Bae"
  index: number | null; // -> null
  durationMs: number; // -> 138371
  live: boolean; // -> false
  seekable: boolean; // -> true
  url: string | null; // -> null
  thumbnail: string | null; // -> null
  thumbnailSmall: string | null; // -> null
  requester: {
    id: number; // -> 344672338744442900
    name: string; // -> "vuolo"
    avatar: string; // -> "https://cdn.discordapp.com/avatars/344672338744442880/a831704795f3e64c3c1152b35e0d2ff9.png"
  };
  type: string; // -> "SOUNDCLOUD"
  sponsor: string | null; // -> null
};

export type TrackResponse = {
  track: TrackDetails;
  status: "LOADED_TRACK"; // -> "LOADED_TRACK"
};

export type TicketResponse = {
  ticket: string; // -> "Qa7enQ+fcS4OOAf1vc+u+FK9xk87zuTLAj+oV6nXgMM="
}