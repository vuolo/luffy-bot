import { YoutubeInfo } from "../types/YoutubeInfo";
import { createAudioResource, StreamType } from "@discordjs/voice";
import { createReadStream } from "fs";
import { join } from "path";
import { main } from "./soundcloud";
import { CommandInteraction } from "discord.js";

// gets next audio resource of the passed in YoutubeInfo parameter
export default async function getNextResource(nextSong: YoutubeInfo, interaction: CommandInteraction) {
    const songTitle = nextSong.originalQuery || nextSong.info?.title;
    if (!songTitle) {
        throw new Error("No title found in YoutubeInfo object");
    }
    console.log(`Searching for ${songTitle}`);

    // 1. Search SoundCloud for the track title
    const query = encodeURIComponent(songTitle);
    const results = await fetch(`https://api-v2.soundcloud.com/search?q=${query}&variant_ids=&facet=model&user_id=413986-242816-600029-584700&client_id=3WIthHrmko3NUQ6wbfCSRvFcDexHgswc&limit=20&offset=0&linked_partitioning=1&app_version=1735826482&app_locale=en`, {
        "headers": {
          "accept": "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-US,en;q=0.9",
          "authorization": "OAuth 2-298571-760405465-hTzaddG9PD5qVg",
          "sec-ch-ua": "\"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        },
        "referrer": "https://soundcloud.com/",
        "referrerPolicy": "origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });

    console.log({
        "status": results.status,
        "statusText": results.statusText
    })
    const resJson = await results.json();
    // console.log(resJson);

    const trackList = resJson.collection;
    console.log(trackList)
    console.log(`Found ${trackList.length} tracks`);
    const track = trackList.find((t: any) => !!t.media);
    if (track) {
        console.log(`Found track: ${track.title} (@${track.permalink_url})`);
    }
    await interaction.channel!.send(`Playing ${track.title} (@${track.permalink_url})`);
    const url = track?.permalink_url || "https://soundcloud.com/taliya-jenkins/double-cheese-burger-hold-the"
    const filename = `file-${
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    }.webm`
    await main(url, filename)

    const resource = createAudioResource(createReadStream(join(__dirname, `../../songs/${filename}.webm`)), {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });
    return resource;
}