const { MessageEmbed } = require('discord.js');
const { reply } = require('./slashLibrary')

const cost = 50;

module.exports = {
    createSlashAnonymous: function createSlashAnonymous(client, server) {
        client.api.applications(client.user.id).guilds(server.id).commands.post({
            data: {
                name: "anonymous",
                description: "Send an anonymous message in your current channel.",
                options: [
                    {
                        "name": "Anonymous",
                        "description": "Send an anonymous message in your current channel.",
                        "type": 3,
                        "required": true,
                    }
                ]
            }
        })
    },

    anonymous: function anonymous(interaction, client) {
        const prefix = (client.db.settings.selectPrefix.pluck().get(interaction.guild_id))
        const points = (client.db.users.selectPoints.pluck().get(interaction.member.user.id))
        if (!points || points < cost)
        {
            reply(interaction, `You need ${cost-points} more points to send an anonymous message in this server.\nEarn points by sending messages, talking in VC, and being active.\nTo check your points, type \`${prefix}\``, client)
        }
        const anonymousAllowed = (client.db.settings.selectAnonymous.pluck().get(interaction.guild_id))
        const anonMsg = interaction.data.options[0].value;
        console.log( {anonymousAllowed})
        if (!anonymousAllowed) {
            reply(interaction, `This server doesn't allow anonymous messages. An admin can change this by typing \`${prefix}setanonymous\``, client)
        } else {
            const embed = new MessageEmbed()
                .setTitle(`Anonymous Message`)
                .setDescription(`"${anonMsg}"`)
                .setFooter("To send an anonymous message, type /anonymous")
                .setColor("RANDOM");
            interaction.channel.send(embed).then(msg => {
                client.db.users.setPoints.run(points - cost, interaction.member.user.id, interaction.guild_id)
                reply(interaction, `Your anonymous message has been posted! ${cost} points have been deducted.`, client)
            })
        }
    }
}