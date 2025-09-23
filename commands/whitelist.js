const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const config = require("../config.json");

module.exports = {
  name: "whitelist",
  aliases: ["wh"], // ✅ alias added
  description: "Show all whitelisted users",
  async execute(message) {
    const hasAccess = 
  message.author.id === config.ownerID ||
  db.prepare("SELECT 1 FROM command_access WHERE user_id = ?").get(message.author.id);

if (!hasAccess) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Permission Denied ❌")
        .setDescription("You don’t have permission to use this command.");
      return message.reply({ embeds: [embed] });
    }

    const rows = db.prepare("SELECT user_id FROM whitelist").all();

    if (!rows.length) {
      const embed = new EmbedBuilder()
        .setColor("Orange")
        .setTitle("📭 Whitelist Empty")
        .setDescription("No users are currently whitelisted.");
      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ Whitelisted Users")
      .setColor("Green")
      .setDescription(
        rows
          .map((row, index) => `**${index + 1}.** <@${row.user_id}> (\`${row.user_id}\`)`)
          .join("\n")
      )
      .setFooter({ text: `Total: ${rows.length} user(s)` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
