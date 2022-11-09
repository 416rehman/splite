const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class ThouArtCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'thouart',
            aliases: ['elizabethan', 'ta'],
            usage: 'thouart [user mention/ID]',
            description: oneLine`
        Says a random Elizabethan insult to the specified user. 
        If no user is given, then the insult will be directed at you!
      `,
            type: client.types.FUN,
            examples: ['thouart @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('user').setRequired(false).setDescription('The user to insult')),
        });
    }

    async run(message, args) {
        const member = await this.getGuildMember(message.guild, args[0]) || message.member;
        await this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.author;
        await this.handle(member, interaction, true);
    }

    async handle(targetUser, context) {
        try {
            const res = await fetch('http://quandyfactory.com/insult/json/');
            let insult = (await res.json()).insult;
            insult = insult.charAt(0).toLowerCase() + insult.slice(1);

            const payload = {
                embeds: [new EmbedBuilder()
                    .setTitle('🎭  Thou Art  🎭')
                    .setDescription(`${targetUser}, ${insult}`)
                    .setFooter({
                        text: this.getUserIdentifier(context.author),
                        iconURL: this.getAvatarURL(context.author),
                    })]
            };

            await this.sendReply(context, payload);
        }
        catch (err) {
            const payload = {
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(fail + ' ' + err.message)
                    .setColor('Red')],
            };
            await this.sendReply(context, payload);
        }
    }
};
