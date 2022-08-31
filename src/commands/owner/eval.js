const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class EvalCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'eval',
            usage: 'eval <code>',
            description: 'Executes the provided code and shows output.',
            type: client.types.OWNER,
            examples: ['eval 1 + 1'],
        });
    }

    run(message, args) {
        const input = args.join(' ');
        this.handle(input, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const input = interaction.options.getString('code');
        this.handle(input, interaction);
    }

    handle(input, context) {
        if (!input)
            return this.sendErrorMessage(
                context,
                0,
                'Please provide code to eval'
            );

        const embed = new MessageEmbed();

        try {
            let output = eval(input);
            if (typeof output !== 'string')
                output = require('util').inspect(output, {depth: 0});

            if (output.includes(this.client.config.token)) {
                return this.sendReply(context, '(╯°□°)╯︵ ┻━┻ MY token. **MINE**.');
            }

            embed
                .addField(
                    'Input',
                    `\`\`\`js\n${
                        input.length > 1024 ? 'Too large to display.' : input
                    }\`\`\``
                )
                .addField(
                    'Output',
                    `\`\`\`js\n${
                        output.length > 1024 ? 'Too large to display.' : output
                    }\`\`\``
                )
                .setColor('#66FF00');
        }
        catch (err) {
            embed
                .addField(
                    'Input',
                    `\`\`\`js\n${
                        input.length > 1024 ? 'Too large to display.' : input
                    }\`\`\``
                )
                .addField(
                    'Output',
                    `\`\`\`js\n${
                        err.length > 1024 ? 'Too large to display.' : err
                    }\`\`\``
                )
                .setColor('#FF0000');
        }

        this.sendReply(context, {embeds: [embed]});

    }
};
