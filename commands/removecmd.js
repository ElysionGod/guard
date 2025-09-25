const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const config = require("../config.json");

// Ensure table exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS command_access (
    user_id TEXT PRIMARY KEY
  )
`).run();

module.exports = {
  name: "removeowner",
  description: "Revoke a user's access to all bot commands",
  async execute(message, args) {
    // Only owner can run this
    if (message.author.id !== config.ownerID) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Permission Denied ❌")
        .setDescription("You don’t have permission to use this command.");
      return message.reply({ embeds: [embed] });
    }

    // Get target user (mention or ID)
    let user = message.mentions.users.first();
    if (!user && args[0]) {
      try {
        user = await message.client.users.fetch(args[0]);
      } catch {
        user = null;
      }
    }

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("Missing Argument ⚠️")
        .setDescription("You must mention a user or provide a valid user ID.");
      return message.reply({ embeds: [embed] });
    }

    // Remove from DB
    db.prepare("DELETE FROM command_access WHERE user_id = ?").run(user.id);

    const embed = new EmbedBuilder()
      .setColor("DarkRed")
      .setTitle("<:deleteuser:1413928416754794546> Command Access Revoked")
      .setDescription(`<:user:1420452265256288349> User <@${user.id}> no longer has access to protected commands.\n <:emoji_10:1414019863373938820> ID: \`${user.id}\``);

    return message.reply({ embeds: [embed] });
  }
};
