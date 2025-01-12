import { getVoiceConnection, VoiceConnectionReadyState } from "@discordjs/voice";
import { Client, CommandInteraction, GuildMember } from "discord.js";
import { createPlayEmbed, createBasicEmbed } from "../../utils/embeds";
import getNextResource from "../../utils/getNextResource";
import skip from "src/services/fredboat/skip";

export default {
    data: {
        name: "skip",
        description: "Pause bot audio",
    },

    async execute(interaction: CommandInteraction, search: string) {
        let embed;
        const member = interaction.member as GuildMember;
        const client = interaction.client as Client;
        const connection = getVoiceConnection(member.guild.id);
        const state = connection!.state as VoiceConnectionReadyState;

        const trackId = "";
        await skip(trackId, interaction.guild?.id);

        // if (!state.subscription?.player.state.status) {
        //     embed = createBasicEmbed("Bot is not currently playing anything!");
        //     return await interaction.channel!.send({ embeds: [embed] });
        // }

        // const queue = client.queueCollection.get(member.guild.id);

        // if (!queue) {
        //     embed = createBasicEmbed(`There are no songs to skip`);
        //     return await interaction.channel!.send({ embeds: [embed] });
        // }

        // queue.shift();
        // const nextSong = queue[0];

        // if (!nextSong) {
        //     console.log("queue is empty");
        //     state.subscription.player.stop();
        //     interaction.client.queueCollection.delete(member.guild.id);
        //     embed = createBasicEmbed("Song queue is now empty");
        //     return await interaction.channel!.send({ embeds: [embed] });
        // }

        // let nextSongResource;
        //         try {
        //         nextSongResource = await getNextResource(nextSong, interaction);
        //         }
        //         catch (error) {
        //             nextSong.originalQuery = "taliya-jenkins/double-cheese-burger-hold-the";
        //             nextSongResource = await getNextResource(nextSong, interaction);
        //         }
        // state.subscription.player.play(nextSongResource);

        // embed = createPlayEmbed(nextSong.info!, nextSong.url!, member.user.id);
        // return await interaction.channel!.send({ embeds: [embed] });
    },
};
