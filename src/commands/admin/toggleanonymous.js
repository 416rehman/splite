const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {success, fail} = require('../../utils/emojis.json');
const {oneLine} = require('common-tags');

module.exports = class ToggleAnonymous extends Command {
    constructor(client) {
        super(client, {
            name: 'toggleanonymous',
            aliases: [
                'tanon',
                'toganon',
                'toggleanon',
                'anon',
                'disableanonymous',
                'enableanonymous',
            ],
            usage: 'toggleanonymous',
            description: oneLine`
        Enables or disables the /anonymous slash command for the server.
      `,
            type: client.types.ADMIN,
            userPermissions: ['ManageGuild'],
            examples: ['toggleanon'],
        });
    }

    run(message,) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction);
    }

    handle(context) {
        const anonymousState = this.client.db.settings.selectAnonymous.pluck().get(context.guild.id);
        let description;

        // Disabled anonymous
        if (!anonymousState) {
            this.client.db.settings.updateAnonymous.run(1, context.guild.id);
            description = `Anonymous messages have been enabled! Type /anonymous to send an anonymous context. ${success}`;
        }
        else {
            this.client.db.settings.updateAnonymous.run(0, context.guild.id);
            description = `Anonymous messages have been disabled! ${fail}`;
        }

        const payload = new EmbedBuilder()
            .setTitle('Settings: `System`')
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .setDescription(description)
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        this.sendReply(context, {embeds: [payload]});
    }
};
