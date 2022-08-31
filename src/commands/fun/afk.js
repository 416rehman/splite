const Command = require('../Command.js');
const {idle} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class AfkCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'afk',

            usage: 'afk <message>',
            description:
                'Set your afk status. While you are afk, everytime you get pinged, the user will see your afk status',
            type: client.types.FUN,
            examples: [`afk Checking out ${client.name}!`],
            slashCommand: new SlashCommandBuilder().addStringOption((o) => o.setName('message').setRequired(false).setDescription('The message you want to set as afk')),
        });
    }

    run(message, args) {
        const messageText = args.join(' ');
        this.handle(messageText, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const messageText = interaction.options.getString('message');
        this.handle(messageText, interaction);
    }

    async handle(messageText, context) {
        try {
            const d = new Date();

            context.client.db.users.updateAfk.run(
                messageText || '',
                d.valueOf(),
                context.author.id,
                context.guild.id
            );

            await (await this.getGuildMember(context.guild, context.author.id))?.setNickname(`[AFK]${context.member.nickname || context.member.displayName}`);
        }
        catch (err) {
            this.client.logger.error(err);
        }
        return this.sendReply(context, messageText ? `${idle} ${context.author} You have gone afk: ${messageText}` : `${idle} ${context.author} You have gone afk!`);
    }
};
