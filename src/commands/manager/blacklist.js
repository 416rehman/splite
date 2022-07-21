const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class BlacklistCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'blacklist',
            aliases: ['obl', 'globalignore', 'oignore'],
            usage: 'blacklist <user mention/ID>',
            description:
                'Blacklist a user - User will not be able to use the bot in any server the bot is in.',
            type: client.types.MANAGER,
            examples: ['blacklist @notSplit'],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((subcommand) => subcommand
                    .setName('blacklist')
                    .setDescription('Blacklist a user - User will not be able to use the bot in any server the bot is in.')
                    .addStringOption((option) => option
                        .setName('id')
                        .setDescription('User ID')
                        .setRequired(true)))

                .addSubcommand((subcommand) => subcommand
                    .setName('whitelist')
                    .setDescription('Removes a user\'s blacklist status')
                    .addStringOption((option) => option
                        .setName('id')
                        .setDescription('User ID')
                        .setRequired(true)))
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0]);
        if (!member)
            return this.sendErrorMessage(
                message,
                0,
                'Please mention a user or provide a valid user ID'
            );
        try {
            if (message.client.isOwner(message.author)) {
                if (message.client.isManager(member))
                    return this.sendErrorMessage(
                        message,
                        0,
                        'You cannot blacklist a bot manager or owner'
                    );
            }

            message.client.db.blacklist.add.run(member.id);
            const embed = new MessageEmbed()
                .setTitle('Blacklist')
                .setDescription(`Successfully blacklisted ${member}.`)
                .setFooter({
                    text: message.member.displayName,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setTimestamp()
                .setColor(message.guild.me.displayHexColor);
            message.channel.send({embeds: [embed]});
        }
        catch (e) {
            this.sendErrorMessage(
                message,
                0,
                'An error occured while blacklisting the user.',
                e.message
            );
        }
    }

    // interaction command:

    async interact(interaction, args) {
        let subcommand = interaction.options.getSubcommand();
        let blacklistID = interaction.options.getString('id');
        let whitelistID = interaction.options.getString('id');

        switch (subcommand) {

            case 'blacklist': {

                if (!blacklistID)
                    return this.sendErrorInteraction(
                        interaction,
                        0,
                        'Please mention a user or provide a valid user ID'
                    );
                try {
                    if (interaction.client.isOwner(interaction.member)) {
                        if (interaction.client.isManager(blacklistID))
                            return this.sendErrorInteraction(
                                interaction,
                                0,
                                'You cannot blacklist a bot manager or owner'
                            );
                    }

                    await interaction.client.db.blacklist.add.run(blacklistID);
                    const embed = new MessageEmbed()
                        .setTitle('Blacklist')
                        .setDescription(`Successfully blacklisted ${blacklistID}.`)
                        .setFooter({
                            text: interaction.member.displayName,
                            iconURL: interaction.member.displayAvatarURL(),
                        })
                        .setTimestamp()
                        .setColor('RED');
                    interaction.reply({ embeds: [embed], ephemeral: true });
                }
                catch (e) {
                    this.sendErrorInteraction(
                        interaction,
                        0,
                        'An error occured while blacklisting the user.',
                        e.message
                    );
                }
            }
                break;

            case 'whitelist': {

                if (!whitelistID)
                    return this.sendErrorInteraction(
                        interaction,
                        0,
                        'Please mention a user or provide a valid user ID'
                    );
                try {
                    if (interaction.client.isOwner(whitelistID)) {
                        if (interaction.client.isManager(whitelistID))
                            return this.sendErrorInteraction(
                                interaction,
                                0,
                                'You cannot whitelist a bot manager or owner'
                            );
                    }

                    await interaction.client.db.blacklist.remove.run(whitelistID);
                    const embed = new MessageEmbed()
                        .setTitle('Whitelist')
                        .setDescription(`Successfully whitelisted ${whitelistID}.`)
                        .setFooter({
                            text: interaction.member.displayName,
                            iconURL: interaction.member.displayAvatarURL(),
                        })
                        .setTimestamp()
                        .setColor('GREEN');
                    interaction.reply({ embeds: [embed], ephemeral: true });
                }
                catch (e) {
                    this.sendErrorInteraction(
                        interaction,
                        0,
                        'An error occured while whitelisting the user.',
                        e.interaction
                    );
                }
            }
                break;
        }
    }
};
