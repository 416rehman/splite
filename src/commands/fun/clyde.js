const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require('../../utils/emojis.json');

module.exports = class clydeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clyde',

            usage: 'clyde <text>',
            description: 'Generates a clyde image with provided text',
            type: client.types.FUN,
            examples: [`clyde ${client.name} is the best bot!`],
        });
    }

    run(message, args) {
        if (!args[0])
            return this.sendErrorMessage(message, 0, 'Please provide some text');

        message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            })
            .then(async (msg) => {
                try {
                    const buffer = await msg.client.nekoApi.generate('clyde', {
                        text: `${args.join(' ')}`,
                    });
                    const attachment = new MessageAttachment(buffer, 'clyde.png');

                    await message.channel.send({files: [attachment]});
                    await msg.delete();
                }
                catch (e) {
                    await msg.edit({
                        embeds: [new MessageEmbed().setDescription(`${fail} ${e}`)],
                    });
                }
            });
    }
};
