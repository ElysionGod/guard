const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const config = require("../config.json");

// Create the table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS command_access (
    user_id TEXT PRIMARY KEY
  )
`).run();

module.exports = {
  name: "addowner",
  description: "Grant another user access to all bot commands",
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

    // Insert into DB
    db.prepare("INSERT OR REPLACE INTO command_access (user_id) VALUES (?)").run(user.id);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ Command Access Granted")
      .setDescription(`👤 User <@${user.id}> now has access to all protected commands.\n🆔 ID: \`${user.id}\``);

    return message.reply({ embeds: [embed] });
  }
};
