const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const {fail, load} = require('../../utils/emojis.json');

module.exports = class changemymindCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'changemymind',

            usage: 'changemymind <text>',
            description: 'Generates a changemymind image with provided text',
            type: client.types.FUN,
            examples: [`changemymind ${client.name} is the best bot!`],
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
                    const buffer = await msg.client.nekoApi.generate(
                        'changemymind',
                        {text: `${args.join(' ')}`}
                    );
                    const attachment = new MessageAttachment(
                        buffer,
                        'changemymind.png'
                    );

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
