const {SlashCommandBuilder} = require('discord.js');
const Command = require('../Command.js');

module.exports = class viewCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'view',
            usage: 'view',
            description: 'View Details Of a Confession',
            type: client.types.FUN,
            clientPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
            cooldown: 5,
            slashCommand: new SlashCommandBuilder().addIntegerOption((option) => option
                .setName('id')
                .setDescription('ID of the confession')
                .setRequired(true)),
        });
    }

    async interact(interaction, args, author) {
        const client = interaction.client;
        const prefix = client.db.settings.selectPrefix
            .pluck()
            .get(interaction.guild.id);
        const viewConfessionsRole = client.db.settings.selectViewConfessionsRole
            .pluck()
            .get(interaction.guild.id);

        if ((!client.isManager(author.user))) {
            if (!viewConfessionsRole) return interaction.reply({
                content: `No role is set to run this command. To set a role to run this command type, \`${prefix}setviewconfessionsrole\``,
                ephemeral: true,
            });
        }

        const guild = client.guilds.cache.get(interaction.guild.id);
        const role = guild.roles.cache.find((r) => r.id === viewConfessionsRole);
        const user = await guild.members.fetch(author.user.id);

        if (!(client.isManager(author.user))) {
            if (!user.roles.cache.has(role.id)) return interaction.reply({
                content: '**You don\'t have perms to run this command**', ephemeral: true,
            });
        }

        const row = client.db.confessions.selectConfessionByID.get(args[0].value);

        if (row && row.guild_id === interaction.guild.id) {
            const sender = await guild.members.fetch(row.author_id);
            const senderTxt = sender ? 'Tag: ' + sender.user.username + '#' + sender.user.discriminator : '';

            return interaction.reply({
                content: `Confession ID: **\`${row.confession_id}\`** \
            \nContent: **\`${row.content}\`**\
            \nSent By: ${sender || 'Someone not in the server'} \`${senderTxt} | ID: ${row.author_id}\`\
            \nDate/Time: **\`${row.timeanddate}\`**`, ephemeral: true,
            });
        }
        else return interaction.reply({
            content: 'Error: Can\'t find that confession! Please check the confession ID', ephemeral: true,
        });
    }
};
