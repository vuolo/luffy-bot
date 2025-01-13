import { FREDBOAT_API_BEARER_TOKEN } from "./_consts";
import { TicketResponse } from "./types";

// needed to create a temp ticket to connect to the WS (e.g., used to get current track/queue for a guild)
export default async () => {
  const jsonData = (await (
    await fetch("https://api2.fredboat.com/ticket", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "authorization": `Bearer ${FREDBOAT_API_BEARER_TOKEN}`,
        "priority": "u=1, i",
        "sec-ch-ua": "\"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://fredboat.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    })
  ).json()) as TicketResponse;

  return jsonData.ticket;
};
