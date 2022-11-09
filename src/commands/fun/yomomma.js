const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');

module.exports = class YoMommaCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'yomamma',
            aliases: ['yourmom', 'yomamma', 'yomama', 'ym'],
            usage: 'yomomma [user mention/ID]',
            description: oneLine`
        Says a random "yo momma" joke to the specified user. 
        If no user is given, then the joke will be directed at you!
      `,
            type: client.types.FUN,
            examples: ['yomomma @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('user').setRequired(false).setDescription('The user to joke about')),
        });
    }

    async run(message, args) {
        const member = await this.getGuildMember(message.guild, args[0]);

        await this.handle(member, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user');
        await this.handle(member, interaction, true);
    }

    async handle(member, context) {
        try {
            const res = await fetch('https://api.yomomma.info');
            let joke = (await res.json()).joke;
            joke = joke.charAt(0).toLowerCase() + joke.slice(1);
            if (!joke.endsWith('!') && !joke.endsWith('.') && !joke.endsWith('"'))
                joke += '!';

            const payload = {
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🍼  Yo Mamma  🍼')
                        .setDescription(member ? `${member}, ${joke}` : `${joke}`)
                        .setFooter({
                            text: this.getUserIdentifier(context.author),
                            iconURL: this.getAvatarURL(context.author),
                        })
                        .setTimestamp()
                ]
            };

            await this.sendReply(context, payload);
        }
        catch (err) {
            const payload = {
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(fail + ' ' + err.message)
                    .setColor('Red')]
            };
            await this.sendReply(context, payload);
        }
    }
};
