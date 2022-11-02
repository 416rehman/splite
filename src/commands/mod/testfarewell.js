const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');

module.exports = class WarnCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'testfarewell',
            aliases: ['testleave', 'tleave', 'tfarewell', 'tf'],
            usage: 'testfarewell',
            description: 'Sends a test farewell message.',
            type: client.types.MOD,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
            userPermissions: ['KICK_MEMBERS'],
            examples: ['testfarewell'],
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
            farewell_channel_id: farewellChannelId,
            farewell_message: farewellMessage,
        } = this.client.db.settings.selectFarewells.get(context.guild.id);
        const farewellChannel =
            context.guild.channels.cache.get(farewellChannelId);

        if (
            farewellChannel &&
            farewellChannel.viewable &&
            farewellChannel
                .permissionsFor(context.guild.members.me)
                .has(['SEND_MESSAGES', 'EMBED_LINKS']) &&
            farewellMessage
        ) {
            farewellMessage = farewellMessage
                .replace(/`?\?member`?/g, context.member.toString()) // Member mention substitution
                .replace(/`?\?username`?/g, context.member.user.username) // Username substitution
                .replace(/`?\?tag`?/g, context.member.user.tag) // Tag substitution
                .replace(/`?\?size`?/g, context.guild.memberCount); // Guild size substitution
            farewellChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(farewellMessage)
                        .setAuthor({
                            name: context.member.user.tag,
                            iconURL: context.member.user.displayAvatarURL({dynamic: true})
                        })
                        .setColor('RANDOM'),
                ],
            });
        }
        else {
            const payload = {
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `${emojis.fail} **There is no farewell message set for this server.**\n\n\`setfarewellmessage\` Sets a farewell context\n\`setfarewellchannel\` Sets the channel to post the farewell message to. `
                        )
                        .setColor('RED')
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
