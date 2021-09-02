const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const { about } = require("../config.json")
const { Guild, getGuildById } = require("../models/guild")

message_generators = {
    "safe_browsing": {
        "logchannel": async function (interaction) {
            const channel = interaction.options.getChannel('channel');
            guildInfo = await getGuildById(interaction.guildId);
            guildInfo.config.safe_browsing.logchannel = channel.id
            await guildInfo.save();
            await interaction.reply({
                content: `Succesfully set the logchannel to ${channel}.`, ephemeral: true
            })
        },
        "actions": async function (interaction) {
            guildInfo = await getGuildById(interaction.guildId);

            function getActionRow(action_name){
                return new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId(`cmd:config.safe_browsing.${action_name}.actions`)
                                .setPlaceholder(`Actions on ${[action_name]} detection...`)
                                .setMinValues(0)
                                .setMaxValues(4)
                                .addOptions([
                                    {
                                        label: 'Warn (In Channel)',
                                        description: 'Issue a warning in chat as a reply to messages containing links of this type.',
                                        value: 'warn_channel',
                                        default: guildInfo.config.safe_browsing[action_name].actions.includes("warn_channel")
                                    },
                                    {
                                        label: 'Warn (In DM)',
                                        description: 'Issue a warning in a DM to the author of messages containing links of this type.',
                                        value: 'warn_dm',
                                        default: guildInfo.config.safe_browsing[action_name].actions.includes("warn_dm")
                                    },
                                    {
                                        label: 'Log',
                                        description: 'Log this action within the defined log channel. Requires a logchannel to be set.',
                                        value: 'log',
                                        default: guildInfo.config.safe_browsing[action_name].actions.includes("log")
                                    },
                                    {
                                        label: 'Delete',
                                        description: 'Delete messages which are detected to contain links of this type.',
                                        value: 'delete',
                                        default: guildInfo.config.safe_browsing[action_name].actions.includes("delete")
                                    },
                                ]),
                        )
            }
            message = await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor('#FFF370')
                        .setTitle(`Safe Browsing Config - Actions`)
                        .setDescription("Use the select menus below to set the actions to take for each type of detection. The boxes relate to, in order: \
                        Malware \nSocial Engineering \n Unwanted Software \n Potentially Harmful Applications")
                ],
                components: [
                    getActionRow("malware"),
                    getActionRow("social_engineering"),
                    getActionRow("unwanted_software"),
                    getActionRow("potentially_harmful_application"),
                ]
                , ephemeral: true
            })
        }
    }
}

select_handlers = {
    "safe_browsing": {
        "malware": async function (interaction, id) {
            guildInfo = await getGuildById(interaction.guildId);
            guildInfo.config.safe_browsing.malware[id] = interaction.values;
            guildInfo.save();
            interaction.reply({ content: "Sucessfully set values.", ephemeral: true })
        },
        "social_engineering": async function (interaction, id) {
            guildInfo = await getGuildById(interaction.guildId);
            guildInfo.config.safe_browsing.social_engineering[id] = interaction.values;
            guildInfo.save();
            interaction.reply({ content: "Sucessfully set values.", ephemeral: true })
        },
        "unwanted_software": async function (interaction, id) {
            guildInfo = await getGuildById(interaction.guildId);
            guildInfo.config.safe_browsing.unwanted_software[id] = interaction.values;
            guildInfo.save();
            interaction.reply({ content: "Sucessfully set values.", ephemeral: true })
        },
        "potentially_harmful_application": async function (interaction, id) {
            guildInfo = await getGuildById(interaction.guildId);
            guildInfo.config.safe_browsing.unwanted_software[id] = interaction.values;
            guildInfo.save();
            interaction.reply({ content: "Sucessfully set values.", ephemeral: true })
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Allows you to configure the bot for your specific server.')
        .addSubcommandGroup(subcommandGroup => subcommandGroup
            .setName("general")
            .setDescription("General configuration settings, not specific to any function.")
        )
        .addSubcommandGroup(subcommandGroup => subcommandGroup
            .setName("safe_browsing")
            .setDescription("Configuration for the Safe Browsing functionality.")
            .addSubcommand(subcommand => subcommand
                .setName("actions")
                .setDescription("Configuration related to actions taken when threats are spotted.")
            )
            .addSubcommand(subcommand => subcommand
                .setName("logchannel")
                .setDescription("Set the channel to log detections in.")
                .addChannelOption(option => option
                    .setName("channel")
                    .setDescription("The channel to log detections to.")
                    .setRequired(true))
            )
        ),

    async execute(interaction) {
        // Try to find the relevant content for the command used.
        target_group = message_generators[interaction.options.getSubcommandGroup()]
        if (target_group != undefined) {
            target_command = target_group[interaction.options.getSubcommand()];
            if (target_command != null) {
                response = await target_command(interaction);
            }
        }
    },

    async select_handler(interaction) {
        ids = interaction.customId.split("cmd:", 2)[1].split(".").slice(1)
        target_group = select_handlers[ids[0]]
        if (target_group != undefined) {
            target_command = target_group[ids[1]];
            if (target_command != null) {
                response = await target_command(interaction, ids.slice(2));
            }
        }
    }
};