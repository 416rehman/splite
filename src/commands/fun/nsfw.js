const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {fail, load} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

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
            usage: 'nsfw <user mention/id>',
            description: 'Random nsfw image/gif',
            type: client.types.FUN,
            nsfwOnly: true,
            examples: ['nsfw boobs', 'nsfw thigh'],
            slashCommand: new SlashCommandBuilder()
                .addStringOption(s =>
                    s.setName('category').setRequired(false).setDescription('The category or genre').addChoices(
                        {name: 'hass', value:'hass'},
                        {name: 'pgif', value:'pgif'},
                        {name: '4k', value:'4k'},
                        {name: 'hentai', value:'hentai'},
                        {name: 'hneko', value:'hneko'},
                        {name: 'hkitsune', value:'hkitsune'},
                        {name: 'kemonomimi', value:'kemonomimi'},
                        {name: 'anal', value:'anal'},
                        {name: 'hanal', value:'hanal'},
                        {name: 'gonewild', value:'gonewild'},
                        {name: 'ass', value:'ass'},
                        {name: 'pussy', value:'pussy'},
                        {name: 'thigh', value:'thigh'},
                        {name: 'hthigh', value:'hthigh'},
                        {name: 'paizuri', value:'paizuri'},
                        {name: 'tentacle', value:'tentacle'},
                        {name: 'boobs', value:'boobs'},
                        {name: 'hboobs', value:'hboobs'},
                    )),
        });
    }

    async run(message, args) {
        await message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(args.shift(), message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const category = interaction.options.getString('category');
        await this.handle(category, interaction, true);
    }

    async handle(category, context, isInteraction) {
        try {
            let chosen;
            if (category) {
                if (types.includes(category))
                    chosen = types.find((e) => e === category);
                else {
                    const description = types.join('\n');
                    const embed = new EmbedBuilder().setDescription(
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
            const embed = new EmbedBuilder()
                .setDescription(`Category: **${chosen}**`)
                .setImage(buffer)
                .setFooter({
                    text: `Specify category like this, ${prefix}nsfw boobs`,
                });

            if (isInteraction) {
                await context.editReply({
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
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(fail + ' ' + err.message)
                .setColor('RED');
            if (isInteraction) {
                await context.editReply({
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
