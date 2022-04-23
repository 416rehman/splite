const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js');
const emoji = require('../../../utils/emojis.json')
const ud = require('urban-dictionary')
const {ReactionMenu} = require('../../ReactionMenu.js');

module.exports = class urbanCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'urban',
            aliases: ['ud', 'urbandictionary', 'dictionary'],
            usage: 'urban',
            description: 'Look up a definition in urban dictionary.',
            type: client.types.FUN,
            examples: ['ud yippee ki yay']
        });
    }

    async run(message, args) {
        const embed = new MessageEmbed()
            .setDescription(`${emoji.load} Fetching Definition`)
            .setTitle(`Urban Dictionary`)
            .setTimestamp()
        message.channel.send({embeds: [embed]}).then(msg => {
            if (!args[0]) {
                ud.random((error, result) => {
                    if (error) embed.setDescription(`${emoji.fail} ${error.message}`)
                    else {
                        embed.setDescription(`**${result[0].word}** \`\`\`${error ? error : result[0].definition}\`\`\``)
                        embed.setFooter({
                            text: message.member.displayName,
                            iconURL: message.author.displayAvatarURL()
                        })
                    }
                    msg.edit({embeds: [embed]})
                })
            } else {
                ud.define(args.join(' '), (error, result) => {
                    if (error) {
                        embed.setDescription(`${emoji.fail} ${error.message}`)
                        msg.edit({embeds: [embed]})
                    } else {
                        msg.delete()
                        const interval = 1;

                        const definitions = result.map(def => {
                            return `**${def.word}** \`\`\`${def.definition}\`\`\``
                        })
                        embed
                            .setFooter(
                                'Expires after two minutes.\n' + message.member.displayName,
                                message.author.displayAvatarURL({dynamic: true})
                            );

                        new ReactionMenu(message.client, message.channel, message.member, embed, definitions, interval);
                    }
                })
            }
        })

    }
};
