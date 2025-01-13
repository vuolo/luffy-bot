import { Events, Client } from "discord.js";
import autoJoin from "../utils/autoJoin";

// when the client is ready, run this code (once)
export default {
  name: Events.ClientReady,
  once: true,

  async execute(client: Client) {
    console.log(`Ready! Logged in as ${client.user?.tag}`);

    // auto-join & start listening
    // await autoJoin(client);
  },
};
