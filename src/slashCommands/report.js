const { reply } = require('./slashLibrary')
module.exports = {
    createSlashReport: function createSlashReport(client, server) {
        console.log(`createSlashReport`)
        client.api.applications(client.user.id).guilds(server.id).commands.post({
            data: {
                name: "report",
                description: "report a ToS-breaking or hateful confession",
                options: [
                    {
                        "name": "ID",
                        "description": "ID of the confession you wish to report.",
                        "type": 4,
                        "required": true,
                    },
                    {
                        "name": "Reason",
                        "description": "Optional: Reason",
                        "type": 3,
                        "required": true,
                    }
                ]
            }
        })
    },

    report: function report(interaction, client) {
        const reportsChannel = client.channels.cache.get(client.confessionReportsID)
        reportsChannel.send(`${interaction.member.user.username}#${interaction.member.user.discriminator} (${interaction.member.user.id}) has reported Confession ID ${interaction.data.options[0].value}\n**Reason**\n||*${interaction.data.options[1].value}*||`).then(() => {
            reply(interaction, `Your report has been received! Thank you`, client)
        })
    }
}