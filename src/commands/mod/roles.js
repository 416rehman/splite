const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const ReactionMenu = require('../ReactionMenu.js');
const { stripIndent } = require('common-tags');
const { inPlaceSort } = require ('fast-sort');
const emojis = require('../../utils/emojis.json')

module.exports = class rolesCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'roles',
            aliases: ['allroles', 'rolecount'],
            usage: 'members <role mention/ID/name>',
            description: 'Displays all the roles of the server with their member count',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
            userPermissions: ['MANAGE_ROLES'],
            examples: ['roles']
        });
    }

    async run(message, args) {
        if (message.guild.roleRetrieval.has(message.guild.id)) {
            return message.reply(`Please wait a while before calling this command.`)
        }
        message.guild.roleRetrieval.set(message.guild.id, true);

        console.log(message.guild.roleRetrieval)
        const max = 25;

        const roleCount = message.guild.roles.cache.size
        const embed = new MessageEmbed()
            .setTitle(`Role Count ${roleCount}`)
            .setDescription(`Total Roles: \`${roleCount}\`\nRemaining Space: \`${250 - roleCount}\`\n\n${emojis.load} Please wait.... This will take a while`)
            .setFooter(`Total Roles: ${roleCount}`)

        message.channel.send(embed).then(
            async msg => {
                if (message.guild.roleRetrieval.has(message.guild.id)) return message.reply(`Role count is already in progress. Please try later!`)
                message.guild.roleRetrieval.set(message.guild.id, true)
                const roles = [];
                try
                {
                    const sorted = message.guild.roles.cache.map(r=> {
                        return { id: r.id, memberCount: r.members.size }
                    })
                    inPlaceSort(sorted).desc(u=>u.memberCount)
                    sorted.forEach(r=>{roles.push(`<@&${r.id}> - \`${r.memberCount} Members\``)})

                    if (roles.length <= max) {
                        msg.edit(embed.setDescription(`Total Roles: \`${roleCount}\`\nRemaining Space: \`${250 - roleCount}\`\n\n${roles.join('\n')}`))
                    } else {
                        msg.edit(embed.setFooter(
                            `Expires after two minutes.\n${Cached ? "This data is from a cached copy. Next cache update at 8PM EST" : ""}`,
                            message.author.displayAvatarURL({dynamic: true})))
                        msg.delete()
                        new ReactionMenu(message.client, message.channel, message.member, embed, roles, max);
                    }
                    msg.edit(embed)
                } catch (e) { console.log(e) }

                message.guild.roleRetrieval.delete(message.guild.id);
            }
        )
    }
};