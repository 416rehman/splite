const {SlashCommandBuilder} = require('@discordjs/builders');
const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');

module.exports = class anonymous extends Command {
    constructor(client) {
        super(client, {
            name: 'anonymous',
            usage: 'anonymous',
            description:
                'Post an anonymous message in current channel. COST: 50 points',
            type: client.types.FUN,
            clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
            cooldown: 5,
            slashCommand: new SlashCommandBuilder().addStringOption((option) =>
                option
                    .setName('message')
                    .setDescription('Type your message')
                    .setRequired(true)
            ),
        });
    }

    interact(interaction) {
        const cost = 1;
        const client = interaction.client;
        const prefix = client.db.settings.selectPrefix
            .pluck()
            .get(interaction.guild.id);
        const anonymousAllowed = client.db.settings.selectAnonymous
            .pluck()
            .get(interaction.guild.id);
        const anonMsg = interaction.options.getString('message');

        if (!anonymousAllowed)
            return interaction.reply({
                content: `This server doesn't allow anonymous messages. An admin can change this by typing \`${prefix}toggleanonymous\``,
                ephemeral: true,
            });

        const points = client.db.users.selectPoints
            .pluck()
            .get(interaction.member.user.id, interaction.guild.id);
        if (!points || points < cost)
            return interaction.reply({
                content: `**You need ${
                    cost - points
                } more points to send an anonymous message in this server.**\n\nTo check your points, type \`${prefix}points\``,
                ephemeral: true,
            });

        const channel = client.channels.cache.get(interaction.channel.id);
        const embed = new MessageEmbed()
            .setTitle('Anonymous Message')
            .setDescription(`"${anonMsg}"`)
            .setFooter({
                text: 'To send an anonymous message, type /anonymous',
            })
            .setColor('RANDOM');
        channel.send({embeds: [embed]}).then(() => {
            client.db.users.setPoints.run(
                points - cost,
                interaction.member.user.id,
                interaction.guild.id
            );
            interaction.reply({
                content: `Your anonymous message has been posted! Remaining points: **\`${
                    points - cost
                }\`**.`,
                ephemeral: true,
            });
        });
    }
};
