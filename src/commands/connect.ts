import { SlashCommandBuilder, CommandInteraction, GuildMember } from "discord.js";
import { joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";

export default {
    data: new SlashCommandBuilder().setName("connect").setDescription("Connects to voice channel"),

    async execute(interaction: CommandInteraction) {
        const member = interaction.member as GuildMember;

        if (!member.voice.channel) {
            return await interaction.reply(
                `${member.user.tag} must be connected to a voice channel for the bot to join`
            );
        }

        // join voice channel user is in
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: member.voice.channel.guild.id,
            adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log("The connection has entered the Ready state - ready to play audio!");
        });

        return await interaction.reply(`Bot has joined the channel ${member.voice.channel.name}`);
    },
};