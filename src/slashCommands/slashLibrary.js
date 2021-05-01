module.exports = {
    reply: reply = (interaction, response, client, ephemeral = true) => {
        client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 3,
                data: {
                    content: response,
                    flags: ephemeral ? 1 << 6 : 0
                },
            }
        })}
}