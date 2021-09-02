const got = require('got');
const linkify = require('linkifyjs')
const { Guild, getGuildById } = require("../models/guild")
const {MessageEmbed} = require("discord.js");

function getURLsFromMessage(message) {
    links = []
    if (message.content) {
        links = links.concat(linkify.find(message.content, 'url'));
    }
    for (embed in message.embeds) {
        if (embed.url) {
            links = links.concat(linkify.find(embed.url))
        }
        if (embed.title) {
            links = links.concat(linkify.find(embed.title))
        }
        if (embed.description) {
            links = links.concat(linkify.find(embed.description))
        }
        if (embed.footer) {
            links = links.concat(linkify.find(embed.footer))
        }
    }
    return links;
}

function defangLink(url){
    newURLArray = url.split(":")
    newURLArray[0] = newURLArray[0].replace(/t/g,"X")
    newURL = newURLArray[0]
    temp = newURLArray.slice(1).join(":")
    newURL += temp.slice(0,temp.lastIndexOf("."))
    newURL += "[.]"
    newURL += temp.slice(temp.lastIndexOf(".")+1)
    return newURL
}

module.exports = {
    listeners: [
        {
            name: 'ready',
            once: true,
            async execute(client) {
                const response = await got('http://safebrowsing:80/status').json();
                console.log(response);
                console.log(`Safe Browsing module loaded.`);
            },
        },
        {
            name: "messageCreate",
            async execute(message) {
                if(message.author.id == message.client.user.id){
                    // Don't check self
                    return;
                }
                const links = getURLsFromMessage(message);
                if (links.length > 0) {
                    const urls = links.map(x => { return { url: x['value'] } })
                    try {
                        result = await got.post("http://safebrowsing:80/v4/threatMatches:find", {
                            json: {
                                "threatInfo": {
                                    "threatTypes": ["UNWANTED_SOFTWARE", "MALWARE", "SOCIAL_ENGINEERING"],
                                    "platformTypes": ["ANY_PLATFORM"],
                                    "threatEntryTypes": ["URL"],
                                    "threatEntries": urls
                                }
                            }
                        }).json()
                        if (result.matches) {
                            // Get the Guild Configuration for the guild this was posted in
                            guildInfo = await getGuildById(message.guild.id);
                            toDelete = false;
                            sendWarning = false;
                            sendDM = false;
                            sendLog = false;
                            warningEmbed = new MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`Link Warnings`)
                            .setTimestamp(new Date())
                            logEmbed = new MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`Potentially Dangerous Link Sent`)
                            .setDescription(`Message sent by ${message.author} in ${message.channel}`)
                            .setFooter(`User ID: ${message.author.id} | Message ID: ${message.id} | Advisory provided by Google - https://developers.google.com/safe-browsing/v4/advisory`)
                            .setTimestamp(new Date())
                            // Iterate through each match and act appropriately
                            for (match of result.matches){
                                console.log(match);
                                switch(match.threatType){
                                    case "UNWANTED_SOFTWARE" :
                                        if(guildInfo.config.safe_browsing.unwanted_software.actions.includes("delete")){toDelete = true;}
                                        if(guildInfo.config.safe_browsing.unwanted_software.actions.includes("log")){
                                            sendLog = true;
                                            logEmbed.addField("Unwanted Software",`${defangLink(match.threat.url)}`)
                                        }
                                        if(guildInfo.config.safe_browsing.unwanted_software.actions.includes("warn_channel")){
                                            sendWarning = true;
                                            warningEmbed.addField("A site linked in this message may contain harmful programs.","Attackers might attempt to trick you into installing programs that harm your browsing experience (for example, by changing your homepage or showing extra ads on sites you visit). You can learn more about unwanted software at [Unwanted Software Policy](http://www.google.com/about/company/unwanted-software-policy.html).")
                                        }
                                        if(guildInfo.config.safe_browsing.unwanted_software.actions.includes("warn_dm")){
                                            sendDM = true;
                                        }
                                        break;
                                    case "MALWARE":
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("delete")){toDelete = true;}
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("log")){
                                            sendLog = true;
                                            logEmbed.addField("Malware",`${defangLink(match.threat.url)}`)
                                        }
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("warn_channel")){
                                            sendWarning = true;
                                            warningEmbed.addField("A site linked in this message may harm your computer.","`"+defangLink(match.threat.url)+"` appears to contain malicious code that could be downloaded to your computer without your consent. You can learn more about harmful web content including viruses and other malicious code and how to protect your computer at StopBadware.org.")
                                        }
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("warn_dm")){
                                            sendDM = true;
                                        }
                                        break;
                                    case "SOCIAL_ENGINEERING" :
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("delete")){toDelete = true;}
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("log")){
                                            sendLog = true;
                                            logEmbed.addField("Malware",`${defangLink(match.threat.url)}`)
                                        }
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("warn_channel")){
                                            sendWarning = true;
                                            warningEmbed.addField("A site linked in this message may be deceptive.","Attackers on `{"+match.threat.url+"}` may trick you into doing something dangerous like installing software or revealing your personal information (for example, passwords, phone numbers, or credit cards). You can find out more about social engineering (phishing) at Social Engineering (Phishing and Deceptive Sites) or from www.antiphishing.org.")
                                        }
                                        if(guildInfo.config.safe_browsing.malware.actions.includes("warn_dm")){
                                            sendDM = true;
                                        }
                                        break;
                                }}
                            
                            if(sendLog && guildInfo.config.safe_browsing.logchannel){
                                logchannel = await message.client.channels.fetch(guildInfo.config.safe_browsing.logchannel)
                                await logchannel.send({embeds: [logEmbed]})
                            }
                            if(sendWarning){
                                await message.reply({embeds: [warningEmbed]})
                            }
                            if(sendDM){
                                await message.author.send({embeds: [warningEmbed]})
                            }
                            if (toDelete){
                                await message.delete()
                             }
                        }
                    } catch(err) { throw err; }
                }
            }
        }
    ]
};