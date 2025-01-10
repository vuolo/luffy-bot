import { CommandInteraction } from "discord.js";
import { createBasicEmbed } from "../../utils/embeds";

export default async function dispatchVoiceCommand(
    transcription: string,
    interaction: CommandInteraction,
    username: string
) {
    const transcriptionArray = transcription.split(" ");
    const transcriptionCommand = transcriptionArray.shift()?.toLowerCase();

    const command = interaction.client.voiceCommands.get(transcriptionCommand);

    if (!command) {

        const luffyNoCommandResponses = [
            `🍆💦🍑 OI, ${username}! WHAT THE FUCK IS '${transcriptionCommand}'?! YOU TRYING TO GET ME ALL HARD AND CONFUSED?! 😏🔥💣`,
            `😏💦🍑 YO, ${username}! '${transcriptionCommand}'?! YOU JUST PULL THAT OUT OF YOUR ASS OR WHAT?! 💩🍆🔥`,
            `🍑🍆💦 WHAT EVEN IS '${transcriptionCommand}', ${username}?! YOU WANNA GET STRETCHED IN ALL THE WRONG WAYS?! 😏🌀🔥`,
            `💦🍆🍗 IF '${transcriptionCommand}' ISN’T ABOUT MEAT OR SOMETHING NASTY, I’M DONE PLAYING WITH YOU, ${username}! 😡🍑💣`,
            `🍑🍆💦 ${username}, YOU BETTER EXPLAIN '${transcriptionCommand}' BEFORE I GUM GUM YOUR WHOLE ASS INTO NEXT WEEK! 👊🔥💦`
        ];

        const embed = createBasicEmbed(
            // `No commands matching ${transcriptionCommand} was found`
            luffyNoCommandResponses[Math.floor(Math.random() * luffyNoCommandResponses.length)]
        );
        console.error(`No commands matching ${transcriptionCommand} was found.`);
        return await interaction.channel!.send({ embeds: [embed] });
    }

    try {
        await command.execute(interaction, transcriptionArray.join(" "));
    } catch (error) {
        console.error(error);
        await interaction.channel!.send("There was an error while executing this command!");
    }
}
