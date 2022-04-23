const Command = require('../../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require("../../../utils/emojis.json")

module.exports = class MockCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'mock',
            aliases: ['spongebob'],
            usage: 'mock <text>',
            description: 'Generates a "mocking-spongebob" image with provided text',
            type: client.types.FUN,
            examples: [`mock ${client.name} is the best bot!`],
        });
    }

    async run(message, args) {
        message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg => {
            try {
                const text = await this.getTexts(message, args);
                const buffer = await msg.client.utils.generateImgFlipImage(102918669, `${text.text1}`, `${text.text2}`)

                if (buffer) {
                    const attachment = new MessageAttachment(buffer, "mocking.png");

                    await message.channel.send({content: text.text1 + text.text2, files: [attachment]})
                    await msg.delete()
                }
            } catch (e) {
                await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
            }
        })
    }

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
};
