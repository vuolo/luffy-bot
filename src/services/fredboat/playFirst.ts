import { FREAKBOB_GUILD_ID } from "./_consts";
import play from "./play";
import search from "./search";

export default async (query: string, guildId = FREAKBOB_GUILD_ID) => {
  const searchResults = await search(query, guildId);
  
  const firstResult = searchResults[0];
  if (!firstResult) {
    console.error("No search results found for query:", query);
    return null;
  }

  return play(firstResult.identifier, guildId);
};
