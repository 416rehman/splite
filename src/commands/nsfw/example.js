const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class nsfwCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'example',
            usage: 'example',
            aliases: ['exam'],
            description: 'This is an example command for the NSFW category (Only available in NSFW channels)',
            type: client.types.NSFW,
            examples: ['betn @split 1000'],
            exclusive: true,
            disabled: true, // Remove this line if you want to enable the command
        });
    }

    // Commands of type NSFW will only be available in NSFW channels
    run(message) {
        const embed = new EmbedBuilder()
            .setTitle('Example Command')
            .setDescription('This is an example command.');
        message.reply({
            embeds: [embed]
        });
    }
};
