const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emoji = require('../../utils/emojis.json');
const ud = require('urban-dictionary');
const ButtonMenu = require('../ButtonMenu.js');
const {load} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class urbanCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'urban-dictionary',
            aliases: ['ud', 'urbandictionary', 'dictionary', 'urban'],
            usage: 'urban',
            description: 'Look up a definition in urban dictionary.',
            type: client.types.FUN,
            examples: ['ud yippee ki yay'],
            slashCommand: new SlashCommandBuilder().addStringOption(s => s.setName('text').setRequired(false).setDescription('The text to look up')),
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text');
        this.handle(text, interaction, true);
    }

    handle(text, context, isInteraction) {
        const embed = new MessageEmbed()
            .setTitle('🎭  Urban Dictionary  🎭')
            .setDescription(`${load} Loading...`)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            });

        if (!text) {
            ud.random((error, result) => {
                if (error)
                    embed.setDescription(`${emoji.fail} ${error.message}`);
                else {
                    embed.setDescription(
                        `**${result[0].word}** \`\`\`${
                            error ? error : result[0].definition
                        }\`\`\``
                    );
                }
                const payload = {embeds: [embed]};
                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
            });
        }
        else {
            ud.define(text, (error, result) => {
                if (error) {
                    embed.setDescription(`${emoji.fail} ${error.message}`);
                    const payload = {embeds: [embed]};
                    if (isInteraction) context.editReply(payload);
                    else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
                }
                else {
                    embed.setFooter({
                        text: 'Expires after two minutes. | ' + this.getUserIdentifier(context.author),
                        iconURL: this.getAvatarURL(context.author),
                    });

                    const interval = 1;

                    const definitions = result.map((def) => {
                        return `**${def.word}** \`\`\`${def.definition}\`\`\``;
                    });

                    new ButtonMenu(
                        this.client,
                        context.channel,
                        context.author,
                        embed,
                        definitions,
                        interval
                    );
                }
            });
        }
    }
};
