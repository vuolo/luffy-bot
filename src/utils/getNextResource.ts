// import { YoutubeInfo } from "../types/YoutubeInfo";
// import play from "play-dl";
// import { createAudioResource, StreamType } from "@discordjs/voice";
// import { createReadStream } from "fs";
// import { join } from "path";

// // gets next audio resource of the passed in YoutubeInfo parameter
// export default async function getNextResource(nextSong: YoutubeInfo) {

    

//     // const stream = await play.stream(nextSong.url!);
//     // const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
//     const resource = createAudioResource(createReadStream(join(__dirname, '../../songs/file.webm')), {
//         inputType: StreamType.WebmOpus,
//         inlineVolume: true,
//     });
//     return resource;
// }

import { YoutubeInfo } from "../types/YoutubeInfo";
import play from "play-dl";
import { createAudioResource, StreamType } from "@discordjs/voice";
import { createReadStream } from "fs";
import { join } from "path";
import { main } from "./soundcloud";

// gets next audio resource of the passed in YoutubeInfo parameter
export default async function getNextResource(nextSong: YoutubeInfo) {
    // // const stream = await play.stream("https://soundcloud.com/kodak-black/skrt");
    // let so_info = await play.soundcloud("https://soundcloud.com/kodak-black/skrt") // Make sure that url is track url only. For playlist, make some logic.
    // console.log(so_info.name) 
    // let stream = await play.stream_from_info(so_info)

    // https://api.soundcloud.com/tracks/259412502/download?client_id=3WIthHrmko3NUQ6wbfCSRvFcDexHgswc

    const songTitle = nextSong.info?.title;
    if (!songTitle) {
        throw new Error("No title found in YoutubeInfo object");
    }

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
    console.log(`Found ${trackList.length} tracks`);
    const track = trackList[0];
    const url = track?.permalink_url || "https://soundcloud.com/taliya-jenkins/double-cheese-burger-hold-the"
    const filename = `file-${
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    }.webm`
    await main(url, filename)

    // scdl.download(url).then(stream => {
    //     connection.play(stream)
    //   })

    // const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
    const resource = createAudioResource(createReadStream(join(__dirname, `../../songs/${filename}.webm`)), {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });
    return resource;
}

// import { YoutubeInfo } from "../types/YoutubeInfo";
// import play from "play-dl";
// import { createAudioResource, AudioResource, StreamType } from "@discordjs/voice";
// import { createReadStream } from "fs";
// import { join } from "path";
// import { spawn } from "child_process";

// export default async function getNextResource(nextSong: YoutubeInfo): Promise<AudioResource> {
//     if (!nextSong.info?.title) {
//         throw new Error("No title found in YoutubeInfo object");
//     }

//     // 1. Search SoundCloud for the track title
//     const results = await play.soundcloud(nextSong.info.title);


//     const scTrack = results

//     // 2. Get the playable stream from SoundCloud
//     //    play.stream(...) returns an object with { stream, type }
//     const { stream } = await play.stream(scTrack.url);

//     // 3. We will download (and transcode) the stream into a .webm file
//     //    Set a unique file name for your downloaded songs
//     const outputFile = join(__dirname, "../../songs", `${scTrack.id}.webm`);

//     // 4. Pipe the readable stream into ffmpeg and transcode to .webm
//     await new Promise<void>((resolve, reject) => {
//         const ffmpeg = spawn("ffmpeg", [
//             "-y",                 // Overwrite if file exists
//             "-i", "pipe:0",       // Read from stdin
//             "-c:a", "libopus",    // Encode to opus
//             "-b:a", "128k",       // Bitrate
//             "-f", "webm",         // Output format
//             outputFile,
//         ]);

//         // Handle ffmpeg events
//         ffmpeg.on("close", (code) => {
//             if (code === 0) {
//                 resolve();
//             } else {
//                 reject(new Error(`ffmpeg process exited with code ${code}`));
//             }
//         });

//         ffmpeg.on("error", (err) => {
//             reject(err);
//         });

//         // Pipe the music stream into ffmpeg's stdin
//         stream.pipe(ffmpeg.stdin);
//     });

//     // 5. Create a read stream from the local .webm file and build the AudioResource
//     const resource = createAudioResource(createReadStream(outputFile), {
//         inputType: StreamType.WebmOpus,
//         inlineVolume: true,
//     });

//     return resource;
// }