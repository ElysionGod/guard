const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const config = require("../config.json");

module.exports = {
  name: "revoke",
  description: "Revoke permission from a user",
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

    // Remove user from whitelist database
    db.prepare("DELETE FROM whitelist WHERE user_id = ?").run(user.id);

    try {
      const channel = message.guild.channels.cache.get(config.protectedChannelID);
      if (channel) {
        // ✅ Completely remove overwrite instead of editing
        await channel.permissionOverwrites.delete(user.id).catch(() => null);

        // ✅ Force disconnect if the user is inside
        const member = channel.members.get(user.id);
        if (member) {
          try {
            await member.voice.disconnect();
            console.log(`⏱️ ${user.username} was disconnected after revoke.`);
          } catch (err) {
            console.error(`⚠️ Failed to disconnect ${user.username}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("⚠️ Failed to remove channel permissions:", err);
    }

    const embed = new EmbedBuilder()
      .setColor("DarkRed")
      .setTitle("<:deleteuser:1413928416754794546> Permission Revoked")
      .setDescription(
        `<:deleteuser:1413928416754794546> User <@${user.id}> is no longer permitted to join your room.\n` +
        `<a:arroww:1416188226925887579> ID: \`${user.id}\`\n` +
        `<a:alert:1413487887353385061> Permission overwrite removed completely.`
      );

    return message.reply({ embeds: [embed] });
  }
};
