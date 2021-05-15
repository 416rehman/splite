const { MessageEmbed } = require('discord.js');
const { reply } = require('./slashLibrary')

module.exports = {
    createSlashView: function createSlashView(client, server) {

        client.api.applications(client.user.id).guilds(server.id).commands.post({
            data: {
                name: "view",
                description: "RESTRICTED COMMAND: View details of a confession",
                options: [
                    {
                        "name": "id",
                        "description": "Type the ID of confession",
                        "type": 4,
                        "required": true,
                    }
                ]
            }
        })
    },

    view: function view(interaction, client) {
        console.log(`Called View`)
        const prefix = client.db.settings.selectPrefix.pluck().get(interaction.guild_id)
        const viewConfessionsRole = client.db.settings.selectViewConfessionsRole.pluck().get(interaction.guild_id)

        if (!viewConfessionsRole) {
            reply(interaction, `No role is set to run this command. To set a role to run this command type, \`${prefix}setviewconfessionsrole\``, client)
        } else
        {
            const guild = client.guilds.cache.get(interaction.guild_id)
            const role = guild.roles.cache.find(r => r.id === viewConfessionsRole)
            const user = guild.members.cache.find(u => u.id === interaction.member.user.id)

            if (!user.roles.cache.has(role.id))
            {
                reply(interaction, `**You don't have perms to run this command**`, client)
            }
            else {
                const row = client.db.confessions.selectConfessionByID.get(interaction.data.options[0].value)


                if (row && row.guild_id === interaction.guild_id)
                {
                    const sender = guild.members.cache.get(row.author_id);
                    const tag = guild.members.cache.get(row.author_id).tag
                    console.log(sender)
                    reply(interaction, `Confession ID: **\`${row.confession_id}\`** \
                    \nContent: **\`${row.content}\`**\
                    \nSent By: **${sender || "Someone not in the server"} ${tag?`[${tag}]`:""} (ID: ${row.author_id})**\
                    \nDate/Time: **\`${row.timeanddate}\`**`, client)
                }
                else reply(interaction, `Error: Can't find that confession! Please check the confession ID`, client)
            }
        }
    }
}