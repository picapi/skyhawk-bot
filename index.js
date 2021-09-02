// Require the necessary discord.js classes
const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config()

// Connect to Database
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// Register bot commands
client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
for (const commandFile of commandFiles){
    const command = require(`./commands/${commandFile}`);
    client.commands.set(command.data.name,command);
}

// Register bot listeners
const eventFiles = fs.readdirSync('./listeners').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const f = require(`./listeners/${file}`);
	for (const e of f.listeners) {
		console.log(e)
		if (e.once) {
			client.once(e.name, async (...args) => await e.execute(...args));
		} else {
			client.on(e.name, async (...args) => await e.execute(...args));
		}
	}
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()){
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if (interaction.isSelectMenu){
		if (interaction.customId.startsWith("cmd:")){
			const command = client.commands.get(interaction.customId.split("cmd:",2)[1].split(".")[0]);
			if (!command) return;

			try {
				await command.select_handler(interaction);
			} catch (error) {
				console.error(error);
				await interaction.reply({ content: 'There was an error while processing your selection!', ephemeral: true });
			}
		}
	}
	
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);