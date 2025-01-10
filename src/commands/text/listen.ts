import {
  SlashCommandBuilder,
  CommandInteraction,
  GuildMember,
  Client,
} from "discord.js";
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { BuiltinKeyword, Porcupine } from "@picovoice/porcupine-node";
import speech from "@google-cloud/speech";
import createRecognitionStream from "../../utils/createRecognitionStream";
import transcribeAudio from "../../utils/transcribeAudio";
import dispatchVoiceCommand from "../voice/dispatchVoiceCommand";
import { createBasicEmbed } from "../../utils/embeds";
import path from "path";

const USE_CUSTOM_WAKE_WORD = true;

export default {
  data: new SlashCommandBuilder()
    .setName("l")
    .setDescription("Connects and listen to audio in voice channel"),

  async execute(interaction: CommandInteraction) {
    let embed;
    const member = interaction.member as GuildMember;
    const client = interaction.client as Client;
    const existingListen = client.listenConnection.get(member.guild.id);

    if (!member.voice.channel) {
      embed = createBasicEmbed(
        "You must be connected to a voice channel to use this command"
      );
      return await interaction.reply({ embeds: [embed] });
    }
    // check if bot is already listening to a user
    if (existingListen)
      return await interaction.reply({
        content: `**Already listening to a user**`,
        ephemeral: true,
      });

    // join voice channel user is in
    const connection = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId: member.voice.channel.guild.id,
      adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5e3);
    } catch (error) {
      console.warn(error);
      return await interaction.reply(
        "Failed to join voice channel within 5 seconds, please try again later!"
      );
    }

    // register connection event listeners
    connection.on(
      VoiceConnectionStatus.Disconnected,
      async (oldState, newState) => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
          // Seems to be a real disconnect which SHOULDN'T be recovered from
          connection.destroy();
        }
      }
    );

    const porcupine = initPorcupine();
    const speechClient = new speech.SpeechClient(); // auth with ADC
    const receiver = connection.receiver;

    client.listenConnection.set(member.guild.id, member.user.id);
    client.porcupineInstance.set(member.guild.id, porcupine);
    client.gcSpeechInstance.set(member.guild.id, speechClient);

    receiver.speaking.on("start", async (userId) => {
      console.log(`User ${userId} started speaking`);
      const DONT_CHECK_USER_ID = true;
      if (DONT_CHECK_USER_ID || userId === client.listenConnection.get(member.guild.id)) {
        let transcription = "";

        const inputAudio = (await createRecognitionStream(
          receiver,
          userId,
          porcupine,
          interaction
        )) as Buffer;

        if (inputAudio.length > 0) {
          transcription = await transcribeAudio(inputAudio, speechClient);
        }

        if (transcription) dispatchVoiceCommand(transcription, interaction);
      }
    });

    const luffyJoinResponses = [
      `Yo, ${member.user.username}, I’m in ${member.voice.channel.name}. Say 'Luffy' and I’ll handle it hard!`,
      `Oi, ${member.user.username}, say 'Luffy' or I’m not touching anything!`,
      `I’m here in ${member.voice.channel.name}. Say 'Luffy' and watch me work!`,
      `${member.user.username}, say 'Luffy' or get nothing from me!`,
      `Gum Gum... I’m in ${member.voice.channel.name}, say 'Luffy' and I’ll go all out!`,
      `Yo, ${member.user.username}, say 'Luffy' if you want me on you!`,
      `I’m waiting in ${member.voice.channel.name}. Say 'Luffy' and let’s get dirty!`,
      `Oi, ${member.user.username}, say 'Luffy' or I’ll just stay put!`,
      `Gum Gum... say 'Luffy' in ${member.voice.channel.name} and watch me stretch real good!`,
      `Yo, ${member.user.username}, say 'Luffy' or I’m not doing a thing!`,
    ];

    embed = createBasicEmbed(
      // `Bot has joined the channel ${member.voice.channel.name} and is now listening to ${member.user.tag}. Say "luffy" before initiating any commands!`
      luffyJoinResponses[Math.floor(Math.random() * luffyJoinResponses.length)]
    );

    const startup_luffy_server_responses = [
      "Gum Gum... Hold up, gotta stretch first!",
      "OI, I’M NOT FRANKY! Give me a sec!",
      "You rushin’? I’LL CALL ZORO!",
      "Wait, you think I’m in Gear Second already?",
      "GUM GUM... Chill, or I’ll use Haki on ya!",
      "Stretching like before I punched KAIDO—hold on!",
      "Oi, oi! I’m not Enel, no instant zapping here!",
      "Pirate King TAKES HIS TIME!",
      "Gum Gum... Even Garp gives me a moment!",
      "You wanna get KICKED BY SANJI?",
      "Alright, I’m stretched! Like with Doflamingo!",
      "Oi, Usopp didn’t upgrade me, I’m ALL ME!",
      "Almost ready! Don’t want Chopper fixing me up!",
      "Gum Gum... Ready to take on BIG MOM now!",
      "Rush me, and you’ll NEED CHOPPER NEXT!",
    ];

    await interaction.reply({
      embeds: [
        createBasicEmbed(
          // "Voice recognition service firing up...please wait a moment before initiating any commands"
          startup_luffy_server_responses[
            Math.floor(Math.random() * startup_luffy_server_responses.length)
          ]
        ),
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return await interaction.editReply({ embeds: [embed] });
  },
};

function initPorcupine() {
  // instantiate porcupine (hotword detection)
  const accessKey = process.env.PICOVOICE_ACCESS_KEY as string;
  // const porcupine = new Porcupine(accessKey, ["luffy", "loofy", "loo-fy", "loofee", "loufe", "lewfee"], [0.75, 0.75, 0.75, 0.75, 0.75, 0.75]);
  const porcupine = new Porcupine(
    accessKey,
    [
      USE_CUSTOM_WAKE_WORD
        ? path.resolve(__dirname, "../../../Wake_Words/Luffy_Mac.ppn")
        : BuiltinKeyword.JARVIS,
    ],
    [0.85]
  );

  return porcupine;
}
