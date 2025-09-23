const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "avatar",
  aliases: ["a"], // ✅ alias
  description: "Show the avatar of yourself or another user",
  async execute(message, args) {
    // Try mention first
    let user = message.mentions.users.first();

    // If no mention, check for ID
    if (!user && args[0]) {
      try {
        user = await message.client.users.fetch(args[0]);
      } catch {
        user = null;
      }
    }

    // Default: show author’s avatar
    if (!user) user = message.author;

    const embed = new EmbedBuilder()
      .setColor("#000000")
      .setTitle(`<a:arrowR:1416188557504286811>  Avatar of ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setFooter({ text: `Requested by 𝑿0𝒍8 𝑺𝒉𝒊𝒆𝒍𝒅` })
      .setTimestamp();

    // Send the embed
    const sentMessage = await message.channel.send({ embeds: [embed] });

    // Add 2 reactions automatically
    try {
      await sentMessage.react("<a:yes:1413485015970353172>"); // link icon
      await sentMessage.react("<a:no:1413485258195861545>"); // download icon
    } catch (err) {
       console.error("⚠️ Failed to add reactions:", err);
    }
  }
};

