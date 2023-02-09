import {
    SlashCommandBuilder,
    GuildMember,
    CommandInteraction,
    CommandInteractionOptionResolver,
} from "discord.js";
import {
    createAudioPlayer,
    NoSubscriberBehavior,
    getVoiceConnection,
    createAudioResource,
} from "@discordjs/voice";
import { join } from "path";
import getYoutubeInfo from "../utils/getYoutubeInfo";

export default {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play audio from a song/video")
        .addStringOption((option) =>
            option.setName("search").setDescription("what do you want to play?").setRequired(true)
        ),

    async execute(interaction: CommandInteraction) {
        const options = interaction.options as CommandInteractionOptionResolver;
        const member = interaction.member as GuildMember;
        const connection = getVoiceConnection(member.guild.id);

        if (!connection) return await interaction.reply("Bot is not currently in a channel");

        const search = options.getString("search")!;

        const url = await getYoutubeInfo(search);

        if (!url) return await interaction.reply("Could not find the given video/song");

        // create audio player
        const audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop,
            },
        });

        audioPlayer.on("error", (error) => {
            console.error(error);
        });

        const subscription = connection.subscribe(audioPlayer);

        // const resource = createAudioResource(join(__dirname, "example.mp3"));
        // audioPlayer.play(resource);

        return await interaction.reply("now playing");
    },
};
