const { Client, GatewayIntentBits, Collection, ActivityType } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const fs = require("fs");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Load commands
fs.readdirSync("./commands")
  .filter(file => file.endsWith(".js"))
  .forEach(file => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
if (command.aliases) {
  for (const alias of command.aliases) {
    client.commands.set(alias, command);
  }
}
  });

// Load events
fs.readdirSync("./events")
  .filter(file => file.endsWith(".js"))
  .forEach(file => {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => event.execute(...args, client));
    if (event.init) event.init(client);
  });

// === Function to join voice ===
function connectToProtectedChannel() {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return console.error("❌ Guild not found. Check config.json!");

    const channel = guild.channels.cache.get(config.protectedChannelID);
    if (!channel) return console.error("❌ Voice channel not found. Check config.json!");

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });
    console.log(`🎶 Ensured connection to: ${channel.name}`);
  } catch (err) {
    console.error("⚠️ Failed to join voice channel:", err);
  }
}

// Bot ready log + presence + 24/7 voice join
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag} and the bot is now ON!`);

  // === Presence Setup ===
  client.user.setPresence({
    status: "idle",
    activities: [
      {
        name: "X0l8 Guard",
        type: ActivityType.Watching
      }
    ]
  });

  // Initial join
  connectToProtectedChannel();
});

// Auto-return if bot gets disconnected
client.on("voiceStateUpdate", (oldState, newState) => {
  const botId = client.user.id;

  // Detect if the bot left the protected channel
  if (
    oldState.member?.id === botId &&
    oldState.channelId === config.protectedChannelID &&
    !newState.channelId
  ) {
    console.log("⚠️ Bot was disconnected. Rejoining...");
    setTimeout(connectToProtectedChannel, 2000); // wait 2s before retry
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) return;

  try {
    await client.commands.get(commandName).execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Error executing command.");
  }
});

client.login(config.token);
