import { CommandInteraction } from "discord.js";
import userIds from "../consts/user-ids";
import {
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
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
  
  // must convert to webm: https://www.freeconvert.com/wav-to-webm

  let needsToSpeak = false;
  const customUser = userIds[userId]; // "mikey" | "rafe" | "blake" | "jonny" | "conor" | "justin"
  const lowercaseTranscription = transcription.toLowerCase().trim();

  const didSayCommand = ["play", "skip", "pause", "resume", "disconnect"].some(
    (command) => lowercaseTranscription.startsWith(command)
  );
  const command = didSayCommand ? lowercaseTranscription.split(" ")[0] : null;

  let filename = "";
  if (!didSayCommand) {
    switch (customUser) {
      case "mikey":
        filename = "personalized/fk-u/mikey-luffy-f-u-mikey.wav";
        break;
      case "rafe":
        filename = "personalized/fk-u/rafe-Luffy-F-U-Ralph.wav";
        break;
      case "blake":
        filename = "personalized/fk-u/blake-luffy-BLAKE-F-U-BITCH.wav";
        break;
      case "jonny":
        filename = "personalized/fk-u/jonny-luffy-tts-file-f-u.wav";
        break;
      case "conor":
        filename = "personalized/fk-u/conor-luffy-F-U-CONOR.wav";
        break;
      case "justin":
        filename = "personalized/fk-u/justin-luffy-JUSTIN-U-R-BITCH.wav";
        break;
      default:
        filename = "-unorganized/luffy-U-F-U-BITCH.wav";
        break;
    }
  } else if (didSayCommand) {
    switch (command) {
      case "play":
        const isSillyBillyChrismtas =
          lowercaseTranscription.includes("silly") &&
          lowercaseTranscription.includes("billy") &&
          lowercaseTranscription.includes("christmas");
        if (isSillyBillyChrismtas)
          filename = "commands/play/luffy-tts-file-sillybillychristmas.wav";
        else filename = "commands/play/luffy-tts-file-y-yell-at-me.wav";
        break;
      case "skip":
        filename = "commands/skip/luffy-tts-file-SKIP-CALLMEDADDY.wav";
        break;
      case "pause":
        break;
      case "resume":
        break;
      case "disconnect":
        break;
    }
  }

  needsToSpeak = !!filename;
  if (!needsToSpeak) {
    console.log(
      `Luffy doesn't need to speak in response to this command (transcription: ${transcription})`
    );
    return;
  }

  const path = join(__dirname, `../../voice-lines/${filename}.webm`);
  const resource = createAudioResource(createReadStream(path), {
    inputType: StreamType.WebmOpus,
    inlineVolume: true,
  });

  try {
    const connection = getVoiceConnection(interaction.guild?.id!);
    const audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
    connection!.subscribe(audioPlayer);

    console.log(
      `Playing voice line for ${
        customUser || userId
      } -- ${filename} -- ${transcription} -- ${path}`
    );

    audioPlayer.play(resource);
  } catch (error) {
    console.error(error);
  }
};
