const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../database/db");
const config = require("../config.json");

module.exports = {
  name: "permit",
  description: "Allow a user to stay in your voice channel",
  async execute(message, args) {
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

    // Try mention first, then raw ID
    let user = message.mentions.users.first();
    if (!user && args[0]) {
      try {
        user = await message.client.users.fetch(args[0]); // fetch user by ID
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

    // Add user to whitelist database
    db.prepare("INSERT OR REPLACE INTO whitelist (user_id) VALUES (?)").run(user.id);

    // Try to update channel permissions
    try {
      const channel = message.guild.channels.cache.get(config.protectedChannelID);
      if (channel) {
        await channel.permissionOverwrites.edit(user.id, {
          [PermissionFlagsBits.ViewChannel]: true,   // 👀 can see the room
          [PermissionFlagsBits.Connect]: true,   // join voice
          [PermissionFlagsBits.Speak]: true,     // talk
          [PermissionFlagsBits.Stream]: true,    // camera/screen share
        });
      }
    } catch (err) {
      console.error("⚠️ Failed to set channel permissions:", err);
    }

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("<a:yes:1413485015970353172> Verification Process")
      .setDescription(
        `<:user:1420452265256288349> User <@${user.id}> has been successfully **verified**.\n` +
        `<:emoji_10:1414019863373938820> ID: \`${user.id}\``
      );

    return message.reply({ embeds: [embed] });
  }
};
