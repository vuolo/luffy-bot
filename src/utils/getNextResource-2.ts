import { YoutubeInfo } from "../types/YoutubeInfo";
import { createAudioResource, StreamType } from "@discordjs/voice";
import { createReadStream, existsSync, createWriteStream } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import ytdl from "ytdl-core";  // or import * as ytdl from "ytdl-core";

export default async function getNextResource(nextSong: YoutubeInfo) {
    console.debug("getNextResource called with:", nextSong);

    // 1) Build safe filenames
    const safeTitle = (nextSong.info?.title || "unknown_title")
        .replace(/[^a-z0-9]/gi, "_")
        .trim();

    const songsDir = join(__dirname, "../../songs");

    // Original (mp4). If you want just audio, you might name it `.mp3` or `.m4a` etc.
    const originalPath = join(songsDir, `${safeTitle}.mp4`);

    // Final webm file for Discord
    // const finalPath    = join(songsDir, `${safeTitle}.webm`);
    const finalPath    = join(songsDir, `file.webm`);
    console.log("Final path:", finalPath);

    return createAudioResource(createReadStream(finalPath), {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });

    // 2) Download the original if it doesn't exist
    if (!existsSync(originalPath)) {
        console.debug("Original file does not exist, downloading:", originalPath);
        await downloadWithYtdl(nextSong.url!, originalPath);
        console.debug("Done downloading original file:", originalPath);
    } else {
        console.debug("Original file already exists, skip download:", originalPath);
    }

    // 3) Transcode to .webm if it doesn't exist
    if (!existsSync(finalPath)) {
        console.debug("Final WebM file does not exist, converting:", finalPath);
        await convertToWebm(originalPath, finalPath);
        console.debug("Done converting to WebM:", finalPath);
    } else {
        console.debug("Final WebM already exists, skip converting:", finalPath);
    }

    // 4) Create and return a Discord audio resource from .webm
    console.debug("Creating audio resource from:", finalPath);
    const resource = createAudioResource(createReadStream(finalPath), {
        inputType: StreamType.WebmOpus,
        inlineVolume: true,
    });

    return resource;
}

/**
 * Downloads the original YouTube file (video + audio) to `outputPath`
 * using ytdl-core. This includes video, so it can be quite large.
 * If you only want audio, see the notes below.
 */
async function downloadWithYtdl(url: string, outputPath: string) {
    return new Promise<void>((resolve, reject) => {
        // If you only want audio, you can do:
        //   ytdl(url, { filter: "audioonly" })
        // or set "quality: 'highest'" etc. as needed.
        const stream = ytdl(url, {
            quality: "highest", // or 'lowest' if you want smaller/faster
        });

        const writeStream = createWriteStream(outputPath);

        stream.pipe(writeStream);

        stream.on("error", (err) => {
            console.error("ytdl stream error:", err);
            reject(err);
        });

        writeStream.on("finish", () => {
            resolve();
        });

        writeStream.on("error", (err) => {
            console.error("writeStream error:", err);
            reject(err);
        });
    });
}

/**
 * Uses FFmpeg to convert the downloaded file into a .webm (Opus) for Discord playback.
 */
async function convertToWebm(inputPath: string, outputPath: string) {
    return new Promise<void>((resolve, reject) => {
        console.debug(`Spawning FFmpeg to convert: ${inputPath} -> ${outputPath}`);

        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-i", inputPath,  // input
            "-c:a", "libopus",
            "-b:a", "128k",
            "-vn",           // no video in final
            "-f", "webm",
            outputPath,
        ]);

        // Log ffmpeg errors to debug
        ffmpeg.stderr.on("data", (data) => {
            console.debug(`[FFmpeg]: ${data.toString()}`);
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                console.debug("FFmpeg finished successfully");
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
}