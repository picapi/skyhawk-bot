const { SlashCommandBuilder } = require('@discordjs/builders');
const {MessageEmbed} = require("discord.js");
const { about } = require("../config.json")


module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Replies with information about the current version of the bot!'),
	async execute(interaction) {
        const versionEmbed = new MessageEmbed()
            .setColor('#FFF370')
            .setTitle(`Skyhawk - Version ${about.version}`)
            .setDescription(about.description)
            .setTimestamp(new Date())
			.addField("Privacy","View our privacy policy [here](about:blank).")

		await interaction.reply( {embeds: [versionEmbed], });
	},
};