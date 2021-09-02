const {MessageEmbed} = require("discord.js");

async function sendError(interaction, error_message){
    const error_embed = 
    new MessageEmbed()
    .setColor('#FF0000')
    .setTitle(`An error has occured.`)
    .setDescription(error_message)
    .setTimestamp(new Date());

    await interaction.reply( {embeds: [error_embed], ephemeral: true});
}


module.exports = {sendError}