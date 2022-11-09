const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class testWelcomeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'testwelcome',
            aliases: ['testjoin', 'twelcome', 'tjoin', 'tw', 'tj'],
            usage: 'testwelcome',
            description: 'Sends a test welcome message.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
            userPermissions: ['KICK_MEMBERS'],
            examples: ['testwelcome'],
        });
    }

    run(message) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction);
    }

    handle(context) {
        let {
            welcome_channel_id: welcomeChannelId,
            welcome_message: welcomeMessage,
        } = this.client.db.settings.selectWelcomes.get(context.guild.id);
        const welcomeChannel = context.guild.channels.cache.get(welcomeChannelId);

        if (
            welcomeChannel &&
            welcomeChannel.viewable &&
            welcomeChannel
                .permissionsFor(context.guild.members.me)
                .has(['SEND_MESSAGES', 'EMBED_LINKS']) &&
            welcomeMessage
        ) {
            welcomeMessage = welcomeMessage
                .replace(/`?\?member`?/g, context.member) // Member mention substitution
                .replace(/`?\?username`?/g, context.member.user.username) // Username substitution
                .replace(/`?\?tag`?/g, context.member.user.tag) // Tag substitution
                .replace(/`?\?size`?/g, context.guild.memberCount); // Guild size substitution
            welcomeChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(welcomeMessage)
                ],
            });
        }
        else {
            const payload = {
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `${emojis.fail} There is no welcome message set for this server.\n\n\`setwelcomemessage\` Sets a welcome context\n\`setwelcomechannel\` Sets the channel to post the welcome message to. `
                        )
                        .setColor('Red')
                        .setFooter({
                            text: context.member.displayName,
                            iconURL: context.author.displayAvatarURL({
                                dynamic: true,
                            }),
                        })
                        .setTimestamp(),
                ],
            };
            this.sendReply(context, payload);
        }
    }
};
