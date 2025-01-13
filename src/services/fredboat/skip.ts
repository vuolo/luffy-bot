/**
 * skip.ts
 *
 * This file:
 *  1. If trackId is NOT given, fetch a ticket & open a WS to read the "playerUpdate".
 *  2. Logs the trackId from "playerUpdate" if found, closes WS early.
 *  3. Proceeds to DELETE track from Fredboat (if a trackId was eventually given or if you
 *     want to do so even if trackId is undefined—adjust to your needs).
 */
import { WebSocket } from "ws";
import createTicket from "./createTicket";
import { FREDBOAT_API_BEARER_TOKEN, FREAKBOB_GUILD_ID } from "./_consts";
import { WebSocketMessage } from "./types.ws";
import { sayVoiceLine } from "../../utils/transcribeAudio";
import { CommandInteraction } from "discord.js";

export default async (
  trackId?: string,
  guildId = FREAKBOB_GUILD_ID,
  userId?: string,
  interaction?: CommandInteraction
) => {
  // If no trackId is provided, let's:
  // 1) get a ticket
  // 2) connect to WS
  // 3) read messages until we find "playerUpdate" or time out
  // 4) log the track ID from that message
  if (!trackId) {
    const ticket = await createTicket();
    const wsUrl = `wss://api2.fredboat.com/player/${guildId}?ticket=${ticket}`;

    try {
      const { rawMessages, firstPlayerUpdateTrackId } =
        await collectWebSocketMessages(wsUrl, FREDBOAT_API_BEARER_TOKEN, 500);

      console.log("All raw messages ->", rawMessages);

      if (firstPlayerUpdateTrackId) {
        console.log("Player Update track ID ->", firstPlayerUpdateTrackId);
        trackId = firstPlayerUpdateTrackId;
      } else {
        console.log("No 'playerUpdate' track ID found in the WS messages");
      }
    } catch (err) {
      console.error("[Error] while collecting WS messages:", err);
    }
  }

  // Do your "delete track" fetch:
  // If you definitely want to remove a track, ensure `trackId` isn't empty at this point
  // or optionally skip if trackId is not provided.
  if (!trackId) {
    console.log(
      "> attempted to skip, but no trackId provided to DELETE. No action taken."
    );
    if (interaction)
    {
      console.log("No track to skip, sending voice line");
      await sayVoiceLine(
        userId ?? "",
        "skip <no-track>",
        interaction,
        "skipped-no-track"
      );
    } else {
      console.log("No track to skip, no interaction provided");
    }
    return;
  } else {
    console.log(`> Skipping (deleting) track with ID: ${trackId}`);
  }

  const response = await fetch(
    `https://api2.fredboat.com/guilds/${guildId}/track/${trackId}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        authorization: `Bearer ${FREDBOAT_API_BEARER_TOKEN}`,
        priority: "u=1, i",
        "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Referer: "https://fredboat.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      method: "DELETE",
    }
  );

  return response;
};

function collectWebSocketMessages(
  wsUrl: string,
  bearerToken: string,
  timeout = 500
): Promise<{ rawMessages: string[]; firstPlayerUpdateTrackId?: string }> {
  return new Promise((resolve, reject) => {
    const rawMessages: string[] = [];
    let closeTimeout: NodeJS.Timeout | null = null;
    let firstPlayerUpdateTrackId: string | undefined;

    // Create the WebSocket
    const ws = new WebSocket(wsUrl, {
      headers: {
        authorization: `Bearer ${bearerToken}`,
      },
    });

    ws.on("open", () => {
      // Set fallback closure after `timeout`
      closeTimeout = setTimeout(() => {
        ws.close();
      }, timeout);
    });

    // On each new message:
    ws.on("message", (data) => {
      const msgStr = data.toString();
      rawMessages.push(msgStr);

      let parsed: WebSocketMessage;
      try {
        parsed = JSON.parse(msgStr);
      } catch (e) {
        console.error("Unable to parse WS message:", e);
        return;
      }

      // If it's a playerUpdate, we can read the trackId & close early
      if (parsed.op === "playerUpdate") {
        const playerUpdate = parsed;
        firstPlayerUpdateTrackId = playerUpdate?.d?.track?.id;
        console.log(
          "[WS] playerUpdate -> track.id =",
          firstPlayerUpdateTrackId
        );

        // Now let's close early
        ws.close();
      }
    });

    // Handle error
    ws.on("error", (err) => {
      if (closeTimeout) clearTimeout(closeTimeout);
      reject(err);
    });

    // Handle close
    ws.on("close", () => {
      if (closeTimeout) clearTimeout(closeTimeout);
      resolve({ rawMessages, firstPlayerUpdateTrackId });
    });
  });
}
