const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")
const {SlashCommandBuilder} = require("@discordjs/builders");

async function createImagePayload(text1, text2, requestingUser) {
    const buffer = await this.client.utils.generateImgFlipImage(102918669, `${text1}`, `${text2}`)

    if (buffer) {
        const attachment = new MessageAttachment(buffer, "mocking.png");
        const embed = new MessageEmbed()
            .setTitle(`${this.getUserIdentifier(requestingUser)} is mocking ${text1}`)
            .setDescription(`${text2}`)
            .setImage("attachment://mocking.png")
            .setFooter({
                text: this.getUserIdentifier(requestingUser),
                iconURL: this.getAvatarURL(requestingUser)
            })
        return {embeds: [embed], files: [attachment]}
    }
}

module.exports = class MockCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mock',
            aliases: ['spongebob'],
            usage: 'mock <text>',
            description: 'Generates a "mocking-spongebob" image with provided text',
            type: client.types.FUN,
            examples: [`mock ${client.name} is the best bot!`],
            slashCommand: new SlashCommandBuilder()
                .addSubcommand(sc=>
                    sc.setName('text')
                    .setDescription('Generates a "mocking-spongebob" image with provided text')
                        .addStringOption(o=>
                            o.setName('text')
                            .setRequired(true)
                            .setDescription('Text to be mocked')
                        )
                )
                .addSubcommand(sc =>
                    sc.setName('user')
                    .setDescription('Generates a "mocking-spongebob" image with user\'s last message')
                        .addUserOption(o=>
                            o.setName('user')
                            .setRequired(true)
                            .setDescription('User to be mocked')
                        )
                )
        });
    }

    async run(message, args) {
        message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg => {
            try {
                const text = await this.getTexts(message, args);
                const payload = await createImagePayload.call(this, text.text1, text.text2, message.author);
                await msg.edit(payload);
            } catch (e) {
                await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
            }
        })
    }

    // Get texts from quoting
    async getTexts(message, args) {
        return new Promise((async (resolve, reject) => {
            //If reply
            if (message.reference) {
                await message.channel.messages.fetch(message.reference.messageId).then(async ref => {

                    const text1 = ref.member.displayName + ': '
                    let text2 = await message.client.utils.replaceMentionsWithNames(ref.content, ref.guild)

                    text2 = message.client.utils.spongebobText(text2)
                    resolve({text1, text2})
                })
            } else {
                const text1 = args[0].startsWith('<@') ? message.mentions.users.size > 0 ? message.mentions.users.first().username + ': ' : '' : ''

                let text2 = message.client.utils.spongebobText(args.join(' '))

                if (text1.length > 0) text2 = text2.replace(`<@!${message.mentions.users.first().id}>`, '')
                text2 = await message.client.utils.replaceMentionsWithNames(text2, message.guild)
                resolve({text1, text2})
            }
            reject('Failed')
        }))
    }

    async interact(interaction, args) {
        interaction.deferReply();
        if (interaction.options.getSubcommand() == 'text' ) {
            const text = interaction.options.getString('text');
            const payload = await createImagePayload.call(this, '', this.client.utils.spongebobText(text), interaction.author);
            interaction.reply(payload);
        }
        else if (interaction.options.getSubcommand() == 'user') {
            const user = interaction.options.getUser('user');

            interaction.channel.messages.fetch({limit: 100}).then(async messages => {
                if (messages.size > 0) {
                    const user_messages = await messages.filter(m => m.author.id === user.id);
                    const lastMessage = await user_messages.first();

                    if (!lastMessage.author) {
                        return interaction.reply({
                            content: `${fail} Failed to find last message from ${user.username}`,
                            ephemeral: true
                        });
                    }

                    this.client.utils.replaceMentionsWithNames(lastMessage.content, lastMessage.guild).then(async text => {
                        const payload = await createImagePayload.call(this, this.getUserIdentifier(lastMessage.author), this.client.utils.spongebobText(text), interaction.author);
                        lastMessage.reply(payload).then(()=>interaction.deleteReply())

                    })
                } else {
                    return interaction.reply({
                        content: `${fail} Failed to find last message from ${user.username}`,
                        ephemeral: true
                    });
                }
            });
        }
    }
};
