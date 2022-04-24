const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")

module.exports = class circleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'circle',

            usage: 'burn <user mention/id>',
            description: 'Generates a circle image',
            type: client.types.FUN,
            examples: ['circle @split']
        });
    }

    async run(message, args) {
        const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.author;

        message.channel.send({embeds: [new MessageEmbed().setDescription(`${load} Loading...`)]}).then(async msg => {
            try {
                const buffer = await msg.client.ameApi.generate("circle", {url: this.getAvatarURL(member, "png")});
                const attachment = new MessageAttachment(buffer, "circle.png");

                await message.channel.send({files: [attachment]})
                await msg.delete()
            } catch (e) {
                await msg.edit({embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)]})
            }
        })
    }
};
