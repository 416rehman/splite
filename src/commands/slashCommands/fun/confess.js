const { SlashCommandBuilder } = require('@discordjs/builders');
const Command = require('../../Command.js');
const {MessageEmbed} = require('discord.js')

module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'confess',
            usage: 'confess',
            description: 'Post an anonymous confession in the confession channel',
            type: client.types.FUN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: [],
            ownerOnly: false,
            cooldown: 5,
            slashCommand:  new SlashCommandBuilder()
                .addStringOption(option =>
                    option.setName('confession')
                        .setDescription('Type your confession').setRequired(true))
        });
    }

    async run(interaction, args) {
        const client = interaction.client;
        const prefix = (client.db.settings.selectPrefix.pluck().get(interaction.guild.id))
        const confessionsChannelID = (client.db.settings.selectConfessionsChannelId.pluck().get(interaction.guild.id))
        if (!confessionsChannelID) return interaction.reply( {content: `This server doesn't have a confessions channel. Create one by using \`${prefix}setconfessions #channel\``, ephemeral: true})

        const confession = args[0].value;

        const confessionsChannel = client.channels.cache.get(confessionsChannelID)
        const viewConfessionRole = client.db.settings.selectViewConfessionsRole.pluck().get(interaction.guild.id)

        //Random ID
        const d = new Date();
        let n = d.valueOf();
        n = (n.toString())
        n = n.slice(n.length - 6)
        console.log(`wtf`)
        const ftr = client.utils.weightedRandom({0: 50, 1: 50}) ? `Report ToS-breaking or hateful confessions by using /report [confessionID]` : `Type "/confess" in any channel to post a confession here.`
        const embed = new MessageEmbed()
            .setTitle(`Confession ID: ${n}`)
            .setDescription(`"${confession}"`)
            .setFooter(`${ftr} ${viewConfessionRole > 0 ? "| Viewable by staff" : ""}`)
            .setTimestamp()
            .setColor("RANDOM");
        confessionsChannel.send({embeds: [embed]}).then(msg => {
            client.db.confessions.insertRow.run(
                n,
                confession,
                interaction.member.user.id,
                interaction.guild.id,
                d.toISOString()
            );
            interaction.reply({content: `Your confession has been posted!\nhttps://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`, ephemeral: true})
        })
    }
}
