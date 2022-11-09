const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');
const cost = 100;
module.exports = class WipePointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rig',
            aliases: ['setshipodds', 'rigship'],
            usage: 'rig <user mention/ID>',
            description: `Rig the 'ship' command in your favor for 30 mins (Better scores when shipping). Cost: ${cost}`,
            type: client.types.POINTS,
            examples: ['rig'],
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        let bal = this.client.db.users.selectPoints
            .pluck()
            .get(context.author.id, context.guild.id);
        if (bal >= cost) {
            this.client.db.users.updatePoints.run(
                {points: -cost},
                context.author.id,
                context.guild.id
            );
            context.guild.shippingOdds.set(
                context.author.id,
                new Date().getTime()
            );
            context.guild.ships.delete(context.author.id);
            const embed = new EmbedBuilder()
                .setTitle('Rig Ship')
                .setDescription(
                    `Successfully rigged ${context.author}'s shipping odds for 30 mins.`
                )
                .addFields([{name: 'Points Remaining', value:  `${bal - cost} ${emojis.point}`}])
                .setFooter({
                    text: context.member.displayName,
                    iconURL: this.getAvatarURL(context.author),
                })
                .setTimestamp();
            this.sendReply(context, {embeds: [embed]});
        }
        else {
            this.sendReply(
                context,
                `${emojis.nep} **You need ${cost - bal} more points ${emojis.point} in this server to run this command.**\n\nTo check your points ${emojis.point}, use the \`points\` command.`,
                isInteraction);
        }
    }
};
