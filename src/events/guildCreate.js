const {MessageEmbed} = require('discord.js');
const {success} = require('../utils/emojis.json');

module.exports = (client, guild) => {
    client.logger.info(`${client.name} has joined ${guild.name}`);
    const serverLog = client.channels.cache.get(client.supportServerId);
    if (serverLog)
        serverLog.send({
            embeds: [
                new MessageEmbed().setDescription(
                    `${client.user} has joined **${guild.name}** ${success}`
                ),
            ],
        });

    client
        .loadGuild(guild, false, true)
        .then(async () => {
            client.logger.info(`Joined guild ${guild.name}`);

            client.utils.createCollections(client, guild);

            client.logger.info(
                'Started registering application (/) commands for ' + guild.name
            );

            const data = await client.commands.filter((c) => c.slashCommand && c.disabled !== true && c.type !== client.types.OWNER && c.type !== client.types.MANAGER);
            await client.registerSlashCommands(guild, data, client.application.id);

            // Register OWNER and MANAGER commands in the support server
            if (client.config.supportServerId == guild.id) {
                const data = await client.commands.filter((c) => c.slashCommand && (c.type === client.types.OWNER || c.type === client.types.MANAGER));
                await client.registerSlashCommands(guild, data, client.application.id);
            }

            client.logger.info(
                'Finished registering application (/) commands for ' + guild.name
            );
        })
        .catch((err) => {
            client.logger.error(err);
        });
};
