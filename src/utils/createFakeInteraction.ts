import {
  InteractionType,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Client,
  CommandInteractionOptionResolver,
  TextChannel,
} from "discord.js";

/**
 * Creates a fake slash command interaction so we can invoke
 * slash command code programmatically without user input.
 */
export function createFakeInteraction(
  client: Client,
  guild: Guild,
  member: GuildMember,
  commandName: string
): ChatInputCommandInteraction {
  // Some fields below must be explicitly typed or cast
  // because TS will complain that partial objects aren't fully correct
  return {
    // Basic identifiers
    id: "auto-join-interaction",
    type: InteractionType.ApplicationCommand,
    applicationId: client.user?.id ?? "",
    guildId: guild.id,
    guild,
    channelId: member.voice?.channel?.id ?? null,
    // Overload channel in a pinch, you might want to set it
    // to a TextChannel if your slash command needs .send or .id
    channel: (member.voice?.channel as unknown as TextChannel) ?? null,
    member,
    user: member.user,
    commandName,
    
    // If your /l command relies on options:
    // options: new CommandInteractionOptionResolver(client, [], commandName),

    // The client instance
    client,
    createdTimestamp: Date.now(),
    createdAt: new Date(),

    // Required stubs for reply/editReply
    async reply(options) {
      console.log("FakeInteraction.reply called with:", options);
      return;
    },
    async editReply(options) {
      console.log("FakeInteraction.editReply called with:", options);
      return;
    },
    async fetchReply() {
      console.log("FakeInteraction.fetchReply called");
      // Return a fake message
      return {
        content: "Fake reply content",
        id: "fake-message-id",
      } as any;
    },
    deferred: false,
    ephemeral: false,
    replied: false,
    // If your command checks for .deferReply, .followUp, etc., you might need them here
  } as unknown as ChatInputCommandInteraction;
}