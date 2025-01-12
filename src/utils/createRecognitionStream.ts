import { VoiceReceiver, EndBehaviorType } from "@discordjs/voice";
import detectHotword from "./detectHotword";
import prism from "prism-media";
import { Porcupine } from "@picovoice/porcupine-node";
import { CommandInteraction } from "discord.js";
import { createBasicEmbed } from "./embeds";

export default function createRecognitionStream(
  receiver: VoiceReceiver,
  userId: string,
  porcupine: Porcupine,
  interaction: CommandInteraction
) {
  return new Promise((resolve, reject) => {
    const FRAME_LENGTH = porcupine.frameLength; // required frame length for porcupine to process audio data
    const detectedBuffer: Buffer[] = []; // receives buffer data once hotword is detected

    let hotwordDetected = false;
    let frames: any = [];

    // creates a readable stream of opus packets from user voice
    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterInactivity,
        duration: 1500,
      },
    });

    // decodes opus stream to pcm stream
    const decodedStream = new prism.opus.Decoder({
      rate: 16000,
      channels: 1,
      frameSize: 640,
    });
    opusStream.pipe(decodedStream);

    decodedStream.on("data", async (chunk) => {
      if (!hotwordDetected) {
        const int16Array = bufferToInt16(chunk);

        frames = frames.concat(int16Array); // concatenate incoming data to frames
        const normalizedFrames = chunkArray(frames, FRAME_LENGTH);

        // stores partial frame for next iteration to avoid discarding of audio data
        if (
          normalizedFrames[normalizedFrames.length - 1].length !== FRAME_LENGTH
        ) {
          frames = normalizedFrames.pop();
        }

        // runs porcupine on each audio frame to detect hotword
        for (const frame of normalizedFrames) {
          hotwordDetected = detectHotword(frame, porcupine);
          if (hotwordDetected) {
            detectedBuffer.push(chunk);
            const luffy_responses = [
              "GUM GUM... WANT ME TO SHOW YOU HOW FAR I CAN STRETCH? SHISHISHI!",
              "OI, YOU WANNA FEEL MY 'RIFLE'? I PROMISE IT HITS HARD!",
              "GUM GUM... WHIP? BET YOU WON’T LAST A SECOND!",
              "SHISHISHI, YOU ASKING ME TO GO INTO 'SECOND GEAR'? BETTER HOLD ON TIGHT!",
              "WANNA SEE HOW BIG MY 'BALLOON' CAN GET? IT’S PRETTY IMPRESSIVE!",
              "GUM GUM... BAZOOKA! I’LL MAKE SURE YOU FEEL THAT ONE REAL DEEP!",
              "OI, YOU THINK YOU CAN HANDLE 'THIRD GEAR'? DON’T CRY WHEN IT HITS!",
              "GUM GUM... JET PISTOL! FAST AND STRAIGHT TO THE POINT—JUST HOW YOU LIKE IT!",
              "SHISHISHI, YOU TRYING TO MAKE ME GO 'FOURTH GEAR'? YOU’RE IN FOR A WILD RIDE!",
              "OI, IF YOU KEEP TEASING ME, I’LL SHOW YOU MY 'GATLING'—NO MERCY!",
              `what do u want ${(await interaction.client.users.fetch(userId)).username}?`,
            ];
            const embed = createBasicEmbed(
              luffy_responses[
                Math.floor(Math.random() * luffy_responses.length)
              ]
            );
            interaction.channel!.send({ embeds: [embed] });
          }
        }
      } else {
        detectedBuffer.push(chunk);
      }
    });

    // once audio stream ends
    decodedStream.on("end", () => {
      const inputAudio = Buffer.concat(detectedBuffer);

      if (hotwordDetected) {
        hotwordDetected = false;
        resolve(inputAudio);
      }

      resolve([]);
    });

    decodedStream.on("error", (error) => {
      console.log(error);
      reject(new Error("something went wrong"));
    });
  });
}

// receives an array and normalizes to the appropriate size (in this case, converts to arrays of size FRAME_LENGTH)
// from: https://github.com/Picovoice/porcupine/blob/master/binding/nodejs/src/wave_util.ts#L46
function chunkArray(array: any, size: number): Int16Array[] {
  return Array.from({ length: Math.ceil(array.length / size) }, (v, index) =>
    array.slice(index * size, index * size + size)
  );
}

// pass a buffer chunk to convert into a 'pseudo' Int16array for porcupine processing
function bufferToInt16(buffer: Buffer) {
  const int16Array = [];

  for (let i = 0; i < buffer.length; i += 2) {
    int16Array.push(buffer.readInt16LE(i) as never);
  }

  return int16Array;
}
