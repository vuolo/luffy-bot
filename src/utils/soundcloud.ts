import { spawn } from 'child_process';
import { parse } from 'node-html-parser';
import { mkdirSync, existsSync } from 'fs';

const client_id = process.env.SOUNDCLOUD_CLIENT_ID;

// const link = process.argv[2] || 'https://soundcloud.com/rashidaliofficial/kabhi-kabhi-aditi';

/*
 * Download SoundCloud track page HTML code
 */
const getSoundCloundHtml = (link: string) => {
  return new Promise((resolve, reject) => {
    const scUrl = link;
    const curl = spawn("curl", [
      "-A",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
      scUrl
    ]);

    let chunks: Uint8Array[] = [];
    curl.stdout.on("data", data => {
      chunks.push(data);
    });
    curl.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });
    curl.on('error', (error) => {
      console.log(`error: ${error.message}`);
      reject(error);
    });
    curl.on("close", () => {
      const body = Buffer.concat(chunks);
      resolve(body.toString());
    });
  });
};

/*
 * Get m3u8 playlist link from SoundCloud
 */
const getPlaylistLink = (url: string) => {
  return new Promise((resolve, reject) => {
    const curl = spawn("curl", ["--location", "--request", "GET", url]);

    let chunks: Uint8Array[] = [];
    curl.stdout.on("data", data => {
      chunks.push(data);
    });
    curl.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });
    curl.on('error', (error) => {
      console.log(`error: ${error.message}`);
      reject(error);
    });
    curl.on("close", () => {
      const body = Buffer.concat(chunks);
      resolve(body.toString());
    });
  });
};

/*
 * Save the file on disk as WebM in songs/ folder
 */
const saveTrack = (playlistUrl: string, link: string, overrideFileName: string) => {
  return new Promise((resolve, reject) => {
    // Ensure the songs/ directory exists
    if (!existsSync('songs')) {
      mkdirSync('songs');
    }

    const tmp = link.split('/');
    console.log(`converting ${tmp[tmp.length - 1]} to webm`);
    const fileName = `songs/${overrideFileName}.webm`;  // <--- changed path and extension

    // Added "-c:a libopus" for proper WebM audio encoding
    const ffmpeg = spawn("ffmpeg", ["-i", playlistUrl, "-c:a", "libopus", fileName]);
    
    ffmpeg.on('error', (error) => {
      console.log(`error: ${error.message}`);
      reject(error);
    });
    
    ffmpeg.on("close", () => {
      console.log('done');
      resolve('done');
    });
  });
};

export async function main(link: string, overrideFileName: string) {
  let dataText = '';

  // Step 1: Download HTML
  const html = await getSoundCloundHtml(link);
  const root = parse(html as string);

  // Step 2: Parse HTML and get the script tag
  root.querySelectorAll('script').forEach((el) => {
    if (el.innerText.startsWith('window.__sc_hydration')) {
      dataText = el.innerText;
    }
  });

  // Step 3: Execute the JavaScript in the script tag to extract media info
  let x: any;
  const startIndex = dataText.indexOf('[');
  const endIndex = dataText.lastIndexOf(']');
  const str = dataText.substring(startIndex, endIndex + 1);
  eval('x = ' + str);

  // Build the URL for the track's transcodings
  const url = `${x[7].data.media.transcodings[0].url}?client_id=${client_id}&track_authorization=${x[7].data.track_authorization}`;
  
  // Step 4: Download m3u8 playlist file
  const playlistUrl = await getPlaylistLink(url);
  
  // Step 5: Use ffmpeg to save the file as .webm in songs/
  if (typeof playlistUrl === 'string') {
    const result = await saveTrack(JSON.parse(playlistUrl).url, link, overrideFileName);
    console.log(result);
  } else {
    throw new Error('playlistUrl is not a string');
  }
}