const {SlashCommandBuilder} = require('discord.js');
const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');

module.exports = class confessCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'confess',
            usage: 'confess',
            description: 'Post an anonymous confession in the confession channel',
            type: client.types.FUN,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
            userPermissions: [],
            cooldown: 5,
            slashCommand: new SlashCommandBuilder().addStringOption((option) =>
                option
                    .setName('confession')
                    .setDescription('Type your confession')
                    .setRequired(true)
            ),
        });
    }

    interact(interaction) {
        const client = interaction.client;
        const prefix = client.db.settings.selectPrefix
            .pluck()
            .get(interaction.guild.id);
        const confessionsChannelID = client.db.settings.selectConfessionsChannelId
            .pluck()
            .get(interaction.guild.id);
        if (!confessionsChannelID)
            return interaction.reply({
                content: `This server doesn't have a confessions channel. An admin can create one using the \`${prefix}setconfessions #channel\` command.`,
                ephemeral: true,
            });

        const confession = interaction.options.getString('confession');

        const confessionsChannel =
            client.channels.cache.get(confessionsChannelID);
        const viewConfessionRole = client.db.settings.selectViewConfessionsRole
            .pluck()
            .get(interaction.guild.id);

        //Random ID
        const d = new Date();
        let n = d.valueOf();
        n = n.toString();
        n = n.slice(n.length - 6);

        const ftr = client.utils.weightedRandom({
            0: 50,
            1: 50,
        })
            ? 'Report ToS-breaking or hateful confessions by using /report [confessionID]'
            : 'Type "/confess" in any channel to post a confession here.';
        const embed = new EmbedBuilder()
            .setTitle(`Confession ID: ${n}`)
            .setDescription(`"${confession}"`)
            .setFooter({
                text: `${ftr} ${
                    viewConfessionRole > 0 ? '| Viewable by staff' : ''
                }`,
            })
            .setTimestamp();
        confessionsChannel.send({embeds: [embed]}).then((msg) => {
            client.db.confessions.insertRow.run(
                n,
                confession,
                interaction.member.user.id,
                interaction.guild.id,
                d.toISOString()
            );
            interaction.reply({
                content: `Your confession has been posted!\nhttps://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`,
                ephemeral: true,
            });
        });
    }
};
