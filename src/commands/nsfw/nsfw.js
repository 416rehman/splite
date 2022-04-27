const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class nsfwCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'betn',
            usage: 'bet <user mention/id/name> <point count>',
            aliases: ['bet'],
            description:
                'Bet against someone. Winner receives double the bet amount',
            type: client.types.NSFW,
            examples: ['betn @split 1000'],
            exclusive: true,
            disabled: true, // Remove this line if you want to enable the command
        });
    }

    // Commands of type NSFW will only be available in NSFW channels
    run(message) {
        const embed = new MessageEmbed()
            .setTitle('Example Command')
            .setDescription('This is an example command.');
        message.reply({
            embeds: [embed]
        });
    }
};
