import { CommandInteraction, GuildMember } from "discord.js";
import {
    getVoiceConnection,
    createAudioPlayer,
    NoSubscriberBehavior,
    AudioPlayerStatus,
} from "@discordjs/voice";
import { YoutubeInfo } from "../types/YoutubeInfo";
import getNextResource from "./getNextResource";
import { createPlayEmbed } from "./embeds";

export default async function playQueue(
    interaction: CommandInteraction,
    member: GuildMember,
    queue: YoutubeInfo[],
    search: string
) {
    const connection = getVoiceConnection(member.guild.id);
    const firstSong = queue[0];

    const audioPlayer = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });

    connection!.subscribe(audioPlayer);
    let resource;
                    try {
                        resource = await getNextResource(firstSong, interaction);
                    }
                    catch (error) {
                        firstSong.originalQuery = "taliya-jenkins/double-cheese-burger-hold-the";
                        resource = await getNextResource(firstSong, interaction);
                    }
    audioPlayer.play(resource);

    audioPlayer.on("error", (error) => {
        console.error(error);
    });

    audioPlayer.on(AudioPlayerStatus.Idle, async () => {
        queue.shift();
        const nextSong = queue[0];

        if (!nextSong) {
            console.log("queue is empty");
            audioPlayer.stop();
            interaction.client.queueCollection.delete(member.guild.id);
            return;
        }

        let nextSongResource;
                        try {
                        nextSongResource = await getNextResource(nextSong, interaction);
                        }
                        catch (error) {
                            nextSong.originalQuery = "taliya-jenkins/double-cheese-burger-hold-the";
                            nextSongResource = await getNextResource(nextSong, interaction);
                        }
        audioPlayer.play(nextSongResource);

        const nextEmbed = createPlayEmbed(nextSong.info!, nextSong.url!, member.user.id);
        interaction.channel!.send({ embeds: [nextEmbed] });
    });

    const embed = createPlayEmbed(firstSong.info!, firstSong.url!, member.user.id);
    return await interaction.channel!.send({ embeds: [embed] });
}
