const {MessageEmbed} = require('discord.js');
const {success} = require('../utils/emojis.json');

module.exports = async (client, guild) => {

    client.logger.info(`${client.name} has joined ${guild.name}`);
    const serverLog = client.channels.cache.get(client.serverLogId);
    if (serverLog)
        serverLog.send({embeds: [new MessageEmbed().setDescription(`${client.user} has joined **${guild.name}** ${success}`)]});

    client.loadGuild(guild, false, true).then(async () => {
        client.logger.info(`Joined guild ${guild.name}`);

        client.utils.createCollections(client, guild)

        client.logger.info('Started registering application (/) commands for ' + guild.name);
        const data = await client.commands.filter(c => c.slashCommand)
        await client.registerSlashCommands(guild, data, client.application.id)
        client.logger.info('Finished registering application (/) commands for ' + guild.name);
    }).catch(err => {
        client.logger.error(err);
    });

};
