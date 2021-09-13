const { SlashCommandBuilder } = require('@discordjs/builders');
const Command = require('../../Command.js');

module.exports = class prefixCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'view',
            usage: 'view',
            description: 'View Details Of a Confession',
            type: client.types.FUN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            userPermissions: [],
            ownerOnly: false,
            cooldown: 5,
            slashCommand:  new SlashCommandBuilder()
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('ID of the confession').setRequired(true))
        });
    }

    async run(interaction, args) {
        const client = interaction.client;
        const prefix = client.db.settings.selectPrefix.pluck().get(interaction.guild.id)
        const viewConfessionsRole = client.db.settings.selectViewConfessionsRole.pluck().get(interaction.guild.id)

        if (!viewConfessionsRole)
            return interaction.reply({content: `No role is set to run this command. To set a role to run this command type, \`${prefix}setviewconfessionsrole\``, ephemeral: true})

        const guild = client.guilds.cache.get(interaction.guild.id)
        const role = guild.roles.cache.find(r => r.id === viewConfessionsRole)
        const user = guild.members.cache.find(u => u.id === interaction.member.user.id)

        if (!user.roles.cache.has(role.id))
            return interaction.reply({content: `**You don't have perms to run this command**`, ephemeral: true})

        const row = client.db.confessions.selectConfessionByID.get(args[0].value)

        if (row && row.guild_id === interaction.guild.id) {
            const sender = guild.members.cache.get(row.author_id);
            const senderTxt = sender ? 'Tag: ' + sender.user.username + '#' + sender.user.discriminator : ''

            return interaction.reply({content: `Confession ID: **\`${row.confession_id}\`** \
            \nContent: **\`${row.content}\`**\
            \nSent By: ${sender || "Someone not in the server"} \`${senderTxt} | ID: ${row.author_id}\`\
            \nDate/Time: **\`${row.timeanddate}\`**`,
            ephemeral: true})
        }
        else return interaction.reply({content: `Error: Can't find that confession! Please check the confession ID`, ephemeral: true})
    }
}
