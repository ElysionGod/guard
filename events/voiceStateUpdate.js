const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const config = require("../config.json");

async function checkChannel(client) {
  try {
    const guilds = client.guilds.cache;
    for (const [, guild] of guilds) {
      const channel = guild.channels.cache.get(config.protectedChannelID);
      if (!channel || channel.type !== 2) continue; // ensure it's a voice channel

      for (const [id, m] of channel.members) {
        if (m.user.bot) continue;
        if (m.id === config.ownerID) continue; // ✅ never disconnect the owner

        const isWhitelisted = db
          .prepare("SELECT * FROM whitelist WHERE user_id = ?")
          .get(m.id);

        if (!isWhitelisted) {
          try {
            // ✅ redirect or disconnect safely
            if (config.redirectChannelID) {
              const redirectChannel = channel.guild.channels.cache.get(config.redirectChannelID);

              if (redirectChannel && redirectChannel.isVoiceBased()) {
                await m.voice.setChannel(redirectChannel);
                console.log(
                  `⏱️ ${m.user.username} auto-redirected to ${redirectChannel.name} (not whitelisted).`
                );
              } else {
                await m.voice.disconnect();
                console.log(
                  `⏱️ ${m.user.username} auto-disconnected (redirect invalid).`
                );
              }
            } else {
              await m.voice.disconnect();
              console.log(
                `⏱️ ${m.user.username} auto-disconnected (not whitelisted).`
              );
            }

            // ✅ DM the user with embed
            try {
              const embedDM = new EmbedBuilder()
                .setColor("Red")
                .setTitle("<a:no:1413485258195861545> Access Denied")
                .setDescription(
                  `You are **not whitelisted** to stay in **${channel.name}**.\n` +
                    (config.redirectChannelID
                      ? "<a:arrow:1414024729790255206> You have been moved to another room.\n"
                      : "<a:arrow:1414024729790255206> You have been disconnected.\n") +
                    `Please contact the owner <@${config.ownerID}> if you need access.`
                )
                .setTimestamp();

              await m.send({ embeds: [embedDM] });
            } catch {
              console.log(`⚠️ Could not DM ${m.user.username}.`);
            }

            // ✅ Log embed in the voice channel’s chat
            try {
              if (channel.isVoiceBased() && channel.send) {
                const embedLog = new EmbedBuilder()
                  .setColor("Orange")
                  .setTitle("<a:alertn:1420453764883681443> Unauthorized Join Attempt")
                  .setDescription(
                    `<:danger:1420454060108288210> User <@${m.id}> (**${m.user.username}**) tried to join **${channel.name}** without permission.`
                  )
                  .setTimestamp();

                await channel.send({ embeds: [embedLog] });
              }
            } catch (err) {
              console.log("⚠️ Could not send log embed in voice chat:", err);
            }
          } catch (err) {
            console.error(`Failed to move/disconnect ${m.user.username}`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("Periodic check failed:", err);
  }
}

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    if (!newState.channel) return;

    const member = newState.member;
    if (member.user.bot) return;
    if (member.id === config.ownerID) return; // ✅ skip the owner always

    // ✅ Only protect the specific channel
    if (newState.channelId !== config.protectedChannelID) return;

    // Run check immediately when someone joins
    await checkChannel(client);
  },

  // Run every 1 minute to enforce whitelist
  init: (client) => {
    setInterval(() => checkChannel(client), 60 * 1000);
  },
};
