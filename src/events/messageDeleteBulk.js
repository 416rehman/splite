const {MessageEmbed} = require('discord.js');

module.exports = (client, messages) => {
    const message = messages.first();

    // Add to snipe cache
    if (message.author && !message.webhookId && (message.content || message.embeds.length > 0)) {
        try {
            if (message.guild.snipes.has(message.channel.id) && !message.author.bot)
                message.guild.snipes.delete(message.channel.id);
            message.guild.snipes.set(message.channel.id, message);
        }
        catch (e) {
            console.log(e);
        }
    }


    // Get message delete log
    const messageDeleteLogId = client.db.settings.selectMessageDeleteLogId
        .pluck()
        .get(message.guild.id);
    const messageDeleteLog =
        message.guild.channels.cache.get(messageDeleteLogId);
    if (
        messageDeleteLog &&
        messageDeleteLog.viewable &&
        messageDeleteLog
            .permissionsFor(message.guild.me)
            .has(['SEND_MESSAGES', 'EMBED_LINKS'])
    ) {
        const embed = new MessageEmbed()
            .setTitle('Message Update: `Bulk Delete`')
            .setAuthor({
                name: `${message.guild.name}`,
                iconURL: message.guild.iconURL({dynamic: true}),
            })
            .setDescription(
                `**${messages.size} messages** in ${message.channel} were deleted.`
            )
            .setTimestamp()
            .setColor('RED');
        messageDeleteLog.send({embeds: [embed]});
    }
};
