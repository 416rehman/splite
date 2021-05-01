module.exports = {
    reply: reply = (interaction, response, client, ephemeral = true) => {
        client.api.interactions(interaction.id, interaction.token).callback.post({
            data: {
                type: 4, //https://discord.com/developers/docs/interactions/slash-commands#data-models-and-types
                data: {
                    content: response,
                    flags: ephemeral ? 1 << 6 : 0   //1 << 6 = Private, 0 = public.
                },
            }
        })}
}