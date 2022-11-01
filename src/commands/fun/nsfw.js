const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {fail, load} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

const types = Array(
    'hass',
    'pgif',
    '4k',
    'hentai',
    'hneko',
    'hkitsune',
    'kemonomimi',
    'anal',
    'hanal',
    'gonewild',
    'ass',
    'pussy',
    'thigh',
    'hthigh',
    'paizuri',
    'tentacle',
    'boobs',
    'hboobs'
);

module.exports = class thighsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'nsfw',
            aliases: ['18+'],
            usage: 'thighs <user mention/id>',
            description: 'Random nsfw image/gif',
            type: client.types.FUN,
            nsfwOnly: true,
            examples: ['nsfw boobs', 'nsfw thigh'],
            slashCommand: new SlashCommandBuilder()
                .addStringOption(s =>
                    s.setName('category').setRequired(false).setDescription('The category or genre'))
        });
    }

    async run(message, args) {
        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(args.shift(), message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const category = interaction.options.getString('category');
        this.handle(category, interaction, true);
    }

    async handle(category, context, isInteraction) {
        try {
            let chosen;
            if (category) {
                if (types.includes(category))
                    chosen = types.find((e) => e === category);
                else {
                    const description = types.join('\n');
                    const embed = new MessageEmbed().setDescription(
                        `${fail} Category **${category}** Invalid!\n\n**Supported Categories:**\n${description}`
                    );
                    if (isInteraction) {
                        return context.editReply({
                            embeds: [embed],
                        });
                    }
                    else {
                        return context.loadingMessage ? context.loadingMessage.edit({
                            embeds: [embed],
                        }) : context.channel.send({
                            embeds: [embed],
                        });
                    }
                }
            }
            else chosen = types[Math.floor(Math.random() * types.length)];
            const prefix = this.client.db.settings.selectPrefix
                .pluck()
                .get(context.guild.id); // Get prefix
            const buffer = await this.client.nekoApi.get(chosen);
            const embed = new MessageEmbed()
                .setDescription(`Category: **${chosen}**`)
                .setImage(buffer)
                .setFooter({
                    text: `Specify category like this, ${prefix}nsfw boobs`,
                });

            if (isInteraction) {
                context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed],
                }) : context.channel.send({
                    embeds: [embed],
                });
            }
        }
        catch (err) {
            const embed = new MessageEmbed()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('RED');
            if (isInteraction) {
                context.editReply({
                    embeds: [embed],
                });
            }
            else {
                context.loadingMessage ? context.loadingMessage.edit({
                    embeds: [embed]
                }) : context.channel.send({
                    embeds: [embed]
                });
            }
        }
    }
};
