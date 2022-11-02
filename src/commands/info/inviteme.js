const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class InviteMeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'inviteme',
            aliases: ['invite', 'invme', 'im'],
            usage: 'inviteme',
            description: `Generates a link you can use to invite ${client.name} to your own server.`,
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        const embed = new EmbedBuilder()
            .setTitle('Invite Me')
            .setThumbnail(
                `${
                    this.client.config.botLogoURL ||
                    'https://i.imgur.com/B0XSinY.png'
                }`
            )
            .setDescription(
                oneLine`
        Click [here](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot%20applications.commands)
        to invite me to your server!
      `
            )
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        if (this.client.owners.length > 0) {
            embed.addFields([{name: 'Developed By', value:  `${this.client.owners[0]}`, inline:  true}]);
        }

        const payload = {embeds: [embed]};
        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
