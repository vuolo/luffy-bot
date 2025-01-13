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
import userIds from "../../consts/user-ids";

const USE_CUSTOM_WAKE_WORD = true;

export const EXCLUDE_USER_IDS = [
  "184405311681986560", // exclude FredBoat (non-premium)
];

export default {
  data: new SlashCommandBuilder()
    .setName("l")
    .setDescription("Connects and listen to audio in voice channel"),

  async execute(interaction: CommandInteraction) {

    console.log(interaction)

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
      if (EXCLUDE_USER_IDS.includes(userId)) {
        console.log(
          `User ${userId} is excluded (${
            userId === "184405311681986560" ? "FredBoat" : "Unknown"
          })`
        );
        return;
      }

      console.log(`User ${userIds[userId] || userId} started speaking`);
      const DONT_CHECK_USER_ID = true;
      if (
        DONT_CHECK_USER_ID ||
        userId === client.listenConnection.get(member.guild.id)
      ) {
        let transcription = "";

        const inputAudio = (await createRecognitionStream(
          receiver,
          userId,
          porcupine,
          interaction
        )) as Buffer;

        if (inputAudio.length > 0) {
          transcription = await transcribeAudio(
            inputAudio,
            speechClient,
            interaction,
            userId
          );
        }

        if (transcription)
          dispatchVoiceCommand(
            transcription,
            interaction,
            // get the user object using the userId
            (await client.users.fetch(userId)).username
          );
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
    [1]
  );

  return porcupine;
}

export const DEFAULT_INTERACTION = {
  type: 2,
  id: '1328175686900383866',
  applicationId: '1325664338383470675',
  channelId: '1253143500908662797',
  guildId: '1253143500132843551',
  user: {
    id: '344672338744442880',
    bot: false,
    system: false,
    flags: { bitfield: 64 },
    username: 'vuolo',
    discriminator: '0',
    avatar: 'a831704795f3e64c3c1152b35e0d2ff9',
    banner: undefined,
    accentColor: undefined
  },
  member: {
    guild: {
      id: '1253143500132843551',
      name: 'freakbob',
      icon: '27d049f28f8935a549761f34e06c6068',
      features: [Array],
      commands: [],
      members: [],
      channels: [],
      bans: [],
      roles: [],
      presences: {},
      voiceStates: [],
      stageInstances: [],
      invites: [],
      scheduledEvents: [],
      autoModerationRules: [],
      available: true,
      shardId: 0,
      splash: null,
      banner: null,
      description: null,
      verificationLevel: 0,
      vanityURLCode: null,
      nsfwLevel: 0,
      premiumSubscriptionCount: 0,
      discoverySplash: null,
      memberCount: 17,
      large: false,
      premiumProgressBarEnabled: false,
      applicationId: null,
      afkTimeout: 300,
      afkChannelId: '1253143905562792017',
      systemChannelId: '1253143500908662796',
      premiumTier: 0,
      widgetEnabled: null,
      widgetChannelId: null,
      explicitContentFilter: 0,
      mfaLevel: 0,
      joinedTimestamp: 1736477528604,
      defaultMessageNotifications: 0,
      systemChannelFlags: [],
      maximumMembers: 500000,
      maximumPresences: null,
      maxVideoChannelUsers: 25,
      approximateMemberCount: null,
      approximatePresenceCount: null,
      vanityURLUses: null,
      rulesChannelId: null,
      publicUpdatesChannelId: null,
      preferredLocale: 'en-US',
      ownerId: '258414216732606465',
      emojis: [],
      stickers: []
    },
    joinedTimestamp: 1718843275151,
    premiumSinceTimestamp: null,
    nickname: null,
    pending: false,
    communicationDisabledUntilTimestamp: null,
    _roles: [ '1253145620978597968' ],
    user: {
      id: '344672338744442880',
      bot: false,
      system: false,
      flags: [],
      username: 'vuolo',
      discriminator: '0',
      avatar: 'a831704795f3e64c3c1152b35e0d2ff9',
      banner: undefined,
      accentColor: undefined
    },
    avatar: null,
    flags: { bitfield: 0 }
  },
  version: 1,
  appPermissions: { bitfield: 2251799813685247n },
  memberPermissions: { bitfield: 2251799813685247n },
  locale: 'en-US',
  guildLocale: 'en-US',
  commandId: '1327188074580672524',
  commandName: 'l',
  commandType: 1,
  commandGuildId: null,
  deferred: false,
  replied: false,
  ephemeral: null,
  webhook: { id: '1325664338383470675' },
  options: {
    _group: null,
    _subcommand: null,
    _hoistedOptions: []
  }
} as unknown as CommandInteraction;