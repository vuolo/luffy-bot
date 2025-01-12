import { CommandInteraction } from "discord.js";
import userIds from "../consts/user-ids";
import {
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";
import { createReadStream } from "fs";
import { join } from "path";

// transcribes audio data using google cloud speech-to-text client
export default async function transcribeAudio(
  inputAudio: Buffer,
  client: any,
  interaction: CommandInteraction,
  userId: string
) {
  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-us",
    speech_contexts: [
      {
        phrases: ["play", "skip", "pause", "resume", "disconnect"],
      },
    ],
  };

  const audio = {
    content: inputAudio,
  };

  const request = {
    audio: audio,
    config: config,
  };

  const [response]: any = await client.recognize(request);
  const transcription = response.results
    .map((result: any) => result.alternatives[0].transcript)
    .join("\n");
  console.log("Billed time: ", response.totalBilledTime);
  console.log("Transcription: ", transcription);
  if (transcription)
    await interaction.channel!.send(
      `**Transcription:** \`${transcription || "<nothing detected>"}\``
    );
  else {
    await interaction.channel!.send(
      `${
        (
          await interaction.client.users.fetch(userId)
        ).username
      } couldn't hear u bitch`
    );
  }

  await sayVoiceLine(transcription, interaction, userId);

  return transcription;
}

const sayVoiceLine = async (
  transcription: string,
  interaction: CommandInteraction,
  userId: string
) => {
  const customUser = userIds[userId]; // "mikey" | "rafe" | "blake" | "jonny" | "connor" | "justin"

  const filename = "luffy-F-YOR-MOTHA";
  const path = join(__dirname, `../../voice-lines/${filename}.webm`)
  const resource = createAudioResource(
    createReadStream(path),
    {
      inputType: StreamType.WebmOpus,
      inlineVolume: true,
    }
  );

  const audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  console.log(`Playing voice line for ${customUser || userId} -- ${filename} -- ${transcription} -- ${path}`);

  audioPlayer.play(resource);
};
