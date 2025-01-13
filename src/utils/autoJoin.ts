import { Client, Guild, GuildMember } from "discord.js";
import { createFakeInteraction } from "./createFakeInteraction";

// IDs to look for
const RAFE_USER_ID = "335232138070982676";
const MIKEY_USER_ID = "344672338744442880";

export default async function autoJoin(client: Client) {
  // Wait a bit for all guild data to be cached, or do a .fetch if needed
  for (const [guildId, guild] of client.guilds.cache) {
    console.log(`[${guild.name}]: Looking to auto-join`);
    // Make sure we have up-to-date info about members
    await guild.members.fetch().catch(() => null);

    // Check if Rafe or Mikey is in voice
    const rafeOrMikeyMember =
      guild.members.cache.get(RAFE_USER_ID) ?? guild.members.cache.get(MIKEY_USER_ID);

    if (!rafeOrMikeyMember) continue;

    // If they're in a voice channel, let's attempt auto-join
    if (rafeOrMikeyMember.voice?.channel) {
      await handleAutoJoin(guild, rafeOrMikeyMember, client);
    }
  }
}

async function handleAutoJoin(guild: Guild, member: GuildMember, client: Client) {
  // Grab the slash command object for `/l`
  // (assuming you store your commands in client.commands keyed by name)
  const listenCommand = client.textCommands?.get("l");
  if (!listenCommand) return;

  // Create a mock/fake interaction for the /l slash command
  const fakeInteraction = createFakeInteraction(client, guild, member, "l");

  try {
    console.log(
      `Attempting to auto-join voice channel for ${member.user.tag} in ${guild.name}`
    );
    // This calls your `listen.ts` “execute” function
    await listenCommand.execute(fakeInteraction);
  } catch (error) {
    console.error("Error auto-joining voice:", error);
  }
}