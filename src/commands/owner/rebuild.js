const Command = require('../Command.js');
const {MessageEmbed, MessageButton, MessageActionRow} = require('discord.js');

module.exports = class rebuildCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rebuild',
            aliases: ['rebuilddata', 'rebuildserver', 'rebuilduser'],
            usage: 'rebuild <server ID>',
            description: `rebuilds all the server data from the database.`,
            type: client.types.OWNER,
            ownerOnly: true,
            examples: ['rebuild 123456789012345678']
        });
    }

    async run(message, args) {
        const guild = this.client.guilds.cache.get(args[0]);
        const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
        if (!member && !guild)
            return this.sendErrorMessage(message, 0, 'Please provide a valid server ID or user ID or mention.');

        const row = new MessageActionRow()
        row.addComponents(new MessageButton().setCustomId(`proceed`).setLabel(`✅ Proceed`).setStyle('SUCCESS'))
        row.addComponents(new MessageButton().setCustomId(`cancel`).setLabel(`❌ Cancel`).setStyle('DANGER'))

        const embedPrompt = new MessageEmbed().setDescription(`This will rebuild all the data for the guild or user. ALL PREVIOUS DATA WILL BE CLEARED. Are you sure you want to do this?`);
        message.reply({
            embeds: [embedPrompt],
            components: [row]
        }).then(msg => {
            const filter = (button) => button.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({
                filter,
                componentType: 'BUTTON',
                time: 15000,
                dispose: true
            });

            collector.on('collect', async (button) => {
                if (button.customId === 'proceed') {
                    try {
                        const embed = new MessageEmbed()

                        if (guild) {
                            this.client.db.settings.deleteGuild.run(guild.id);
                            this.client.db.users.deleteGuild.run(guild.id);
                            embed.setDescription(`Successfully rebuilt all settings and member data for **${guild.name}**.`);
                            await this.client.loadGuild(guild);
                            embed.setDescription(`Successfully rebuilt all settings and member data for **${guild.name}**.`);
                        } else {
                            this.client.db.deleteUser.run(member.id);
                            embed.setDescription(`Successfully rebuilt ${member}'s Data.`)
                            this.client.db.users.insertRow.run(
                                member.id,
                                member.user.username,
                                member.user.discriminator,
                                member.guild.id,
                                member.guild.name,
                                member.joinedAt.toString(),
                                member.user.bot ? 1 : 0,
                                null, //AFK
                                0,  //Afk_time
                                0,    //OptOutSmashOrPass
                            );

                            this.client.db.bios.insertRow.run(member.id, null)
                            embed.setDescription(`Successfully rebuilt ${member}'s Data.`)
                        }

                        embed.setTitle('rebuild Data')
                            .setFooter({
                                text: message.member.displayName,
                                iconURL: message.author.displayAvatarURL()
                            })
                            .setTimestamp()
                            .setColor(message.guild.me.displayHexColor);

                        msg.edit({components: [], embeds: [embed]});
                    } catch (e) {
                        this.sendErrorMessage(message, 0, 'An error occured while rebuilding the data.', e.message)
                    }
                } else if (button.customId === 'cancel') {
                    msg.edit({components: []});
                }
            });
        })
    }
};
