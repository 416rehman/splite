const Command = require('../Command.js');
const {EmbedBuilder, AttachmentBuilder} = require('discord.js');
const {load, fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

async function createImagePayload(text1, text2, requestingUser) {
    const buffer = await this.client.utils.generateImgFlipImage(
        this.client,
        102918669,
        `${text1}`,
        `${text2}`
    );

    if (buffer) {
        const attachment = new AttachmentBuilder(buffer, {name: 'mocking.png'});
        const embed = new EmbedBuilder()
            .setTitle(
                `${this.getUserIdentifier(requestingUser)} is mocking ${text1}`
            )
            .setDescription(`${text2}`)
            .setImage('attachment://mocking.png')
            .setFooter({
                text: this.getUserIdentifier(requestingUser),
                iconURL: this.getAvatarURL(requestingUser),
            });
        return {embeds: [embed], files: [attachment]};
    }
}

module.exports = class MockCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mock',
            aliases: ['spongebob'],
            usage: 'mock <text>',
            description:
                'Generates a "mocking-spongebob" image with provided text',
            type: client.types.FUN,
            examples: [`mock ${client.name} is the best bot!`],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand((sc) =>
                    sc
                        .setName('text')
                        .setDescription(
                            'Generates a "mocking-spongebob" image with provided text'
                        )
                        .addStringOption((o) =>
                            o
                                .setName('text')
                                .setRequired(true)
                                .setDescription('Text to be mocked')
                        )
                )
                .addSubcommand((sc) =>
                    sc
                        .setName('user')
                        .setDescription(
                            'Generates a "mocking-spongebob" image with user\'s last message'
                        )
                        .addUserOption((o) =>
                            o
                                .setName('user')
                                .setRequired(true)
                                .setDescription('User to be mocked')
                        )
                ),
        });
    }

    run(message, args) {
        if (args.length === 0) {
            return message.reply({embeds: [this.createHelpEmbed(message, this)]});
        }
        message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            })
            .then(async (msg) => {
                try {
                    const text = await this.getTexts(message, args);
                    const payload = await createImagePayload.call(
                        this,
                        text.text1,
                        text.text2,
                        message.author
                    );
                    await msg.edit(payload);
                }
                catch (e) {
                    await msg.edit({
                        embeds: [new EmbedBuilder().setDescription(`${fail} ${e}`)],
                    });
                }
            });
    }

    // Get texts from quoting
    getTexts(message, args) {
        return new Promise((resolve) => {
            //If quoting a message, get that message
            if (message.reference) {
                message.channel.messages
                    .fetch(message.reference.messageId)
                    .then(async (ref) => {
                        const text1 = ref.member.displayName + ': ';
                        let text2 =
                            await this.client.utils.replaceMentionsWithNames(
                                ref.content,
                                ref.guild
                            );

                        text2 = this.client.utils.spongebobText(text2);
                        resolve({text1, text2});
                    });
            }
            //Mock a user, and or text
            else {
                // mentioned user
                const text1 = args[0].startsWith('<@')
                    ? message.mentions.users.size > 0
                        ? message.mentions.users.first().username + ': '
                        : ''
                    : '';

                let text2 = this.client.utils.spongebobText(args.join(' '));

                if (text1.length > 0)
                    text2 = text2.replace(
                        `<@!${message.mentions.users.first().id}>`,
                        ''
                    );
                this.client.utils.replaceMentionsWithNames(
                    text2,
                    message.guild
                ).then((text2) => {
                    resolve({text1, text2});
                }).catch(() => {
                    resolve({text1, text2: ''});
                });
            }
        });
    }

    async interact(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'text') {
            const text = interaction.options.getString('text');
            const payload = await createImagePayload.call(
                this,
                '',
                this.client.utils.spongebobText(text),
                interaction.author
            );
            await this.sendReply(interaction, payload);
        }
        else if (interaction.options.getSubcommand() === 'user') {
            const user = interaction.options.getUser('user');

            interaction.channel.messages
                .fetch({limit: 100})
                .then(async (messages) => {
                    if (messages.size > 0) {
                        const user_messages = await messages.filter(
                            (m) => m.author.id === user.id
                        );
                        const lastMessage = await user_messages.first();

                        if (!lastMessage.author) {
                            return interaction.reply({
                                content: `${fail} Failed to find last message from ${user.username}`,
                                ephemeral: true,
                            });
                        }

                        this.client.utils
                            .replaceMentionsWithNames(
                                lastMessage.content,
                                lastMessage.guild
                            )
                            .then(async (text) => {
                                const payload = await createImagePayload.call(
                                    this,
                                    this.getUserIdentifier(lastMessage.author),
                                    this.client.utils.spongebobText(text),
                                    interaction.author
                                );
                                lastMessage
                                    .reply(payload)
                                    .then(() => interaction.deleteReply());
                            });
                    }
                    else {
                        return interaction.reply({
                            content: `${fail} Failed to find last message from ${user.username}`,
                            ephemeral: true,
                        });
                    }
                });
        }
    }
};
