/**
 * Represents all possible WebSocket messages we might receive.
 */
export type WebSocketMessage =
  | QueueUpdateMessage
  | PlayerUpdateMessage
  | VoteSkipUpdateMessage
  | GuildUpdateMessage
  | VoiceStatusUpdateMessage
  | PermissionsUpdateMessage;

/**
 * A general-purpose interface for track objects that appear in various messages.
 */
export interface Track {
  id: string; // -> "2977913237611893276"
  title: string; // -> "ODDTAXI" or "A Silly Billy Christmas🎄🎵"
  index: number | null; // -> null
  durationMs: number; // -> 203000
  live: boolean; // -> false
  seekable: boolean; // -> true
  url: string | null; // -> null
  thumbnail: string | null; // -> null
  thumbnailSmall: string | null; // -> null
  requester: {
    id: string; // -> "344672338744442880"
    name: string; // -> "vuolo"
    avatar: string; // -> "https://cdn.discordapp.com/avatars/344672338744442880/a831704795f3e64c3c1152b35e0d2ff9.png"
  };
  type: string; // -> "DEEZER", "SOUNDCLOUD", etc.
  sponsor: string | null; // -> null
}

/* ------------------------------------------------------------------
   1) queueUpdate
   ------------------------------------------------------------------ */
export interface QueueUpdateMessage {
  op: "queueUpdate";
  d: Track[];
}

/* ------------------------------------------------------------------
   2) playerUpdate
   ------------------------------------------------------------------ */
export interface PlayerUpdateMessage {
  op: "playerUpdate";
  d: {
    paused: boolean; // -> false
    volume: number; // -> 100
    shuffle: boolean; // -> false
    repeatMode: string; // -> "OFF"
    track: Track; // current track
    position: number; // -> 73630
    suppression: string; // -> "NOT_SUPPRESSED"
  };
}

/* ------------------------------------------------------------------
   3) voteskipUpdate
   ------------------------------------------------------------------ */
export interface VoteSkipUpdateMessage {
  op: "voteskipUpdate";
  d: {
    voters: string[]; // -> []
    votesRequired: number; // -> 2
  };
}

/* ------------------------------------------------------------------
   4) guildUpdate
   ------------------------------------------------------------------ */
export interface GuildUpdateMessage {
  op: "guildUpdate";
  d: {
    piggyAvailable: boolean; // -> false
  };
}

/* ------------------------------------------------------------------
   5) voiceStatusUpdate
   ------------------------------------------------------------------ */
export interface VoiceStatusUpdateMessage {
  op: "voiceStatusUpdate";
  d: {
    botChannel: {
      id: string; // -> "1253143500908662797"
      name: string; // -> "sumter"
      canBotSpeak: boolean; // -> true
    } | null;
    userChannel: {
      id: string; // -> "1253143500908662797"
      name: string; // -> "sumter"
      canBotJoin: boolean; // -> true
    } | null;
  };
}

/* ------------------------------------------------------------------
   6) permissionsUpdate
   ------------------------------------------------------------------ */
export interface PermissionsUpdateMessage {
  op: "permissionsUpdate";
  d: {
    pause: PermissionEntry;
    volume: PermissionEntry;
    setRepeat: PermissionEntry;
    setShuffle: PermissionEntry;
    reshuffle: PermissionEntry;
    addTracks: PermissionEntry;
    skip: PermissionEntry;
    seek: PermissionEntry;
    voteskip: PermissionEntry;
    stop: PermissionEntry;
    configure: PermissionEntry;
    joinVoiceChannel: PermissionEntry;
    reposition: PermissionEntry;
    playlistManage: PermissionEntry;
  };
}

/**
 * Each individual permission entry looks like this:
 */
export interface PermissionEntry {
  label: string; // -> "Pause and unpause"
  allowed: boolean; // -> true
}