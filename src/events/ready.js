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
    //FOR EACH GUILD
    for (const guild of client.guilds.cache.values()) {
        /** ------------------------------------------------------------------------------------------------
         * FIND SETTINGS
         * ------------------------------------------------------------------------------------------------ */
            // Find mod log
        const modLog = guild.channels.cache.find(c => c.name.replace('-', '').replace('s', '') === 'modlog' ||
                c.name.replace('-', '').replace('s', '') === 'moderatorlog');

        // Find admin and mod roles
        const adminRole =
            guild.roles.cache.find(r => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'administrator');
        const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'mod' || r.name.toLowerCase() === 'moderator');
        const muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        const crownRole = guild.roles.cache.find(r => r.name === 'The Crown');

        /** ------------------------------------------------------------------------------------------------
         * UPDATE TABLES
         * ------------------------------------------------------------------------------------------------ */
        // Update settings table
        client.db.settings.insertRow.run(
            guild.id,
            guild.name,
            guild.systemChannelID, // Default channel
            null, //confessions_channel_id
            guild.systemChannelID, // Welcome channel
            guild.systemChannelID, // Farewell channel
            guild.systemChannelID,  // Crown Channel
            modLog ? modLog.id : null,
            adminRole ? adminRole.id : null,
            modRole ? modRole.id : null,
            muteRole ? muteRole.id : null,
            crownRole ? crownRole.id : null,
            null, //joinvoting_message_id
            null,  //joinvoting_emoji
            null,  //voting_channel_id
            0,     //anonymous
            null      //view_confessions_role
        );

        /** ------------------------------------------------------------------------------------------------
         * CROWN ROLE
         * ------------------------------------------------------------------------------------------------ */
        // Schedule crown role rotation
        client.utils.scheduleCrown(client, guild);

        /** ------------------------------------------------------------------------------------------------
         * RUNNING COMMANDS
         * ------------------------------------------------------------------------------------------------ */
        client.utils.createCollections(client, guild)
        guild.me.setNickname(`[${client.db.settings.selectPrefix.pluck().get(guild.id)}] ${client.name}`).catch(() => {});

        /** ------------------------------------------------------------------------------------------------
         * Force Cache all members
         * ------------------------------------------------------------------------------------------------ */
        console.log(`Caching members for ${guild.name}`);
        guild.members.fetch().then(members => {
            members.forEach(member => {
                // Update users table
                client.db.users.insertRow.run(
                    member.id,
                    member.user.username,
                    member.user.discriminator,
                    guild.id,
                    guild.name,
                    member.joinedAt.toString(),
                    member.user.bot ? 1 : 0,
                    null, //AFK
                    0,  //Afk_time
                    0,    //OptOutSmashOrPass
                );

                // Update bios table
                client.db.bios.insertRow.run(member.id, null)
            })

            /** ------------------------------------------------------------------------------------------------
            * CHECK DATABASE
            * ------------------------------------------------------------------------------------------------ */
            // If member left the guild, remove from database
            const currentMemberIds = client.db.users.selectCurrentMembers.all(guild.id).map(row => row.user_id);
            for (const id of currentMemberIds) {
                if (!guild.members.cache.has(id)) {
                    client.db.users.updateCurrentMember.run(0, id, guild.id);
                    client.db.users.wipeTotalPoints.run(id, guild.id);
                }
            }

            // If member joined the guild, add to database
            const missingMemberIds = client.db.users.selectMissingMembers.all(guild.id).map(row => row.user_id);
            for (const id of missingMemberIds) {
                if (guild.members.cache.has(id)) client.db.users.updateCurrentMember.run(1, id, guild.id);
            }

            console.log(`Finished caching members for ${guild.name}`);
        })

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
