const mongoose = require('mongoose');;

const guildConfigurationSchema = new mongoose.Schema({
    safe_browsing: {
        malware: {
            actions: { type: [String], default: ["warn"] },
        },
        social_engineering: {
            actions: { type: [String], default: ["warn"] },
        },
        unwanted_software: {
            actions: { type: [String], default: ["warn"] },
        },
        potentially_harmful_application: {
            actions: { type: [String], default: ["warn"] },
        },
        logchannel: String
    }
});


const schema = new mongoose.Schema({
    discord_id: String,
    config: { type: guildConfigurationSchema, default: () => ({}) }
});

const Guild = mongoose.model('Guild', schema);

async function getGuildById(guildId) {
    foundGuild = await Guild.findOne({ discord_id: guildId }).exec();
    if (foundGuild == null) {
        foundGuild = new Guild({ discord_id: guildId });
        await foundGuild.save();
    }
    return foundGuild;
}

module.exports = { Guild, getGuildById }