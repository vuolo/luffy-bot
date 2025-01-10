import { CommandInteraction } from "discord.js";

// transcribes audio data using google cloud speech-to-text client
export default async function transcribeAudio(inputAudio: Buffer, client: any, interaction: CommandInteraction) {
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
    await interaction.channel!.send(
        `**> Transcription:**\n\`\`\`${transcription}\`\`\``
    );

    return transcription;
}
