const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class CrownCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'crown',
            aliases: ['crowned'],
            usage: 'crown',
            description:
                'Displays all crowned guild members, the crown role, and crown schedule.',
            type: client.types.POINTS,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        const {crown_role_id} = this.client.db.settings.selectCrown.get(
            context.guild.id
        );
        const crownRole =
            context.guild.roles.cache.get(crown_role_id);
        if (!crownRole) {
            const payload = 'There is no crown role set up for this server. Use the `setcrownrole` command to set one up';
            return this.sendReply(context, payload, isInteraction);
        }
        const crowned = [
            ...crownRole.members.values()
        ];

        let description = `${
            emojis.crown
        } ${this.client.utils.trimStringFromArray(crowned)} ${emojis.crown}`;
        if (crowned.length === 0)
            description = `No one has the crown ${emojis.crown}`;

        const embed = new EmbedBuilder()
            .setTitle('Crowned Members')
            .setDescription(description)
            .addFields([{name: 'Crown Role', value:  crownRole.toString()}])
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            });


        if (context.guild.job.nextInvocation) {
            embed.setTimestamp(context.guild.job.nextInvocation())
                .setFooter({text: 'Upcoming Crown Transfer --> '});
        }
        const payload = {embeds: [embed]};
        this.sendReply(context, payload, isInteraction);
    }
};
