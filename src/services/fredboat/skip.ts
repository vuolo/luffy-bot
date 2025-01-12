import { FREAKBOB_GUILD_ID } from "./_consts";

export default async (trackId: string, guildId = FREAKBOB_GUILD_ID) => {
  const response = await fetch(
    `https://api2.fredboat.com/guilds/${guildId}/track/${trackId}`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        authorization: "Bearer S0FG2e8s9BwJZLLmsJJUiZd1TULv6X",
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
      body: null,
      method: "DELETE",
    }
  );

  return response;
};
