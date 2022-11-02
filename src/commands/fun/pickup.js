const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const fetch = require('node-fetch');
const jsdom = require('jsdom');
const {load, fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');
const {JSDOM} = jsdom;

module.exports = class pickupCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'pickup',
            usage: 'pickup',
            aliases: ['compliment'],
            description: 'Create a pickup line and send it to someone',
            type: client.types.FUN,
            examples: ['pickup @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((u) => u.setName('user').setRequired(false).setDescription('The user to compliment')),
        });
    }

    async run(message, args) {
        const member = (await this.getGuildMember(message.guild, args.join(' '))) || message.author;
        await message.channel
            .send({
                embeds: [new EmbedBuilder().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(member, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.author;
        await this.handle(member, interaction, true);
    }

    async handle(targetUser, context, isInteraction) {
        try {
            const res = await fetch('http://www.pickuplinegen.com/');
            const pickup = await res.text();
            const dom = new JSDOM(pickup);
            let line = dom.window.document.getElementById('content').textContent;
            line = line.trim();

            const payload = {
                embeds: [new EmbedBuilder()
                    .setAuthor({
                        name: 'Pickup lines used at your own risk',
                        iconURL: this.getAvatarURL(context.author),
                    })
                    .setDescription(`<@${targetUser.id}>,|| ${line} ||`)
                    .setFooter({
                        text: this.getUserIdentifier(context.author),
                        iconURL: this.getAvatarURL(context.author),
                    })],
            };

            if (isInteraction) await context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }
        catch (err) {
            const payload = {
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(fail + ' ' + err.message)
                    .setColor('RED')]
            };

            if (isInteraction) await context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }

    }
};
