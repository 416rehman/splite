module.exports = async (client) => {
    // Set status
    const activities = [
        {name: `@${client.name} help`, type: 'LISTENING'},
        {name: `@${client.name}`, type: 'LISTENING'}
    ];

    const totalMembers = client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);

    // Update presence
    client.user.setPresence({status: 'online', activities: [activities[0]]});

    let activity = 1;

    // Update activity every 30 seconds
    setInterval(() => {
        activities[2] = {name: `${client.guilds.cache.size} servers`, type: 'WATCHING'}; // Update server count
        activities[3] = {name: `${totalMembers} users`, type: 'WATCHING'}; // Update user count
        if (activity > 3) activity = 0;
        client.user.setActivity(activities[activity]);
        activity++;
    }, 30000);

    client.logger.info('Updating database and scheduling jobs...');
    let i = 1;
    //FOR EACH GUILD
    for (const guild of client.guilds.cache.values()) {
        client.loadGuild(guild).then(async () => {
            client.logger.info(`Loaded guild ${guild.name}`);
            /** ------------------------------------------------------------------------------------------------
             * CROWN ROLE
             * ------------------------------------------------------------------------------------------------ */
            // Schedule crown role rotation
            client.utils.scheduleCrown(client, guild);

            /** ------------------------------------------------------------------------------------------------
             * RUNNING COMMANDS
             * ------------------------------------------------------------------------------------------------ */
            client.utils.createCollections(client, guild)

            /** ------------------------------------------------------------------------------------------------
             * VERIFICATION
             * ------------------------------------------------------------------------------------------------ */
                // Fetch verification message
            const {verification_channel_id: verificationChannelId, verification_message_id: verificationMessageId} =
                    client.db.settings.selectVerification.get(guild.id);
            const verificationChannel = guild.channels.cache.get(verificationChannelId);
            if (verificationChannel && verificationChannel.viewable) {
                try {
                    await verificationChannel.messages.fetch(verificationMessageId);
                } catch (err) { // Message was deleted
                    client.logger.error(err);
                }
            }

            /** ------------------------------------------------------------------------------------------------
             * CACHE PROGRESS BAR
             * ------------------------------------------------------------------------------------------------ */
            console.log(`Servers Cached \r[${'='.repeat(Math.floor(i / client.guilds.cache.size * 50))}${' '.repeat(50 - Math.floor(i / client.guilds.cache.size * 50))}] ${i}/${client.guilds.cache.size}`);
            i++;
        }).catch(err => {
            client.logger.error(`Failed to load guild ${guild.name}`);
            client.logger.error(err);
        });
    }

    // Remove left guilds
    const dbGuilds = client.db.settings.selectGuilds.all();
    const guilds = client.guilds.cache;
    const leftGuilds = dbGuilds.filter(g1 => !guilds.some(g2 => g1.guild_id === g2.id));
    for (const guild of leftGuilds) {
        client.db.settings.deleteGuild.run(guild.guild_id);
        client.db.users.deleteGuild.run(guild.guild_id);

        client.logger.info(`${client.name} has left ${guild.guild_name}`);
    }

    await client.registerAllSlashCommands(client.application.id);

    client.logger.info(`${client.name} is now online`);
    client.logger.info(`${client.name} is running on ${client.guilds.cache.size} server(s)`);
};
