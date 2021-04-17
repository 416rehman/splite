const { MessageEmbed, APIMessage } = require('discord.js');

module.exports = async (client) => {
  const activities = [
    { name: 'your commands', type: 'LISTENING' }, 
    { name: '@Splite', type: 'LISTENING' }
  ];

  // Update presence
  client.user.setPresence({ status: 'online', activity: activities[0] });

  let activity = 1;

  // Update activity every 30 seconds
  setInterval(() => {
    activities[2] = { name: `${client.guilds.cache.size} servers`, type: 'WATCHING' }; // Update server count
    activities[3] = { name: `${client.users.cache.size} users`, type: 'WATCHING' }; // Update user count
    if (activity > 3) activity = 0;
    client.user.setActivity(activities[activity]);
    activity++;
  }, 30000);

  client.logger.info('Updating database and scheduling jobs...');
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
      null,
      guild.systemChannelID, // Welcome channel
      guild.systemChannelID, // Farewell channel
      guild.systemChannelID,  // Crown Channel
      modLog ? modLog.id : null,
      adminRole ? adminRole.id : null,
      modRole ? modRole.id : null,
      muteRole ? muteRole.id : null,
      crownRole ? crownRole.id : null
    );
    
    // Update users table
    guild.members.cache.forEach(member => {
      client.db.users.insertRow.run(
        member.id, 
        member.user.username, 
        member.user.discriminator,
        guild.id, 
        guild.name,
        member.joinedAt.toString(),
        member.user.bot ? 1 : 0
      );
    });
    
    /** ------------------------------------------------------------------------------------------------
     * CHECK DATABASE
     * ------------------------------------------------------------------------------------------------ */ 
    // If member left
    const currentMemberIds = client.db.users.selectCurrentMembers.all(guild.id).map(row => row.user_id);
    for (const id of currentMemberIds) {
      if (!guild.members.cache.has(id)) {
        client.db.users.updateCurrentMember.run(0, id, guild.id);
        client.db.users.wipeTotalPoints.run(id, guild.id);
      }
    }

    // If member joined
    const missingMemberIds = client.db.users.selectMissingMembers.all(guild.id).map(row => row.user_id);
    for (const id of missingMemberIds) {
      if (guild.members.cache.has(id)) client.db.users.updateCurrentMember.run(1, id, guild.id);
    }

    /** ------------------------------------------------------------------------------------------------
     * VERIFICATION
     * ------------------------------------------------------------------------------------------------ */ 
    // Fetch verification message
    const { verification_channel_id: verificationChannelId, verification_message_id: verificationMessageId } = 
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
     * CROWN ROLE
     * ------------------------------------------------------------------------------------------------ */ 
    // Schedule crown role rotation
    client.utils.scheduleCrown(client, guild);

  }

  // Remove left guilds
  const dbGuilds = client.db.settings.selectGuilds.all();
  const guilds = client.guilds.cache.array();
  const leftGuilds = dbGuilds.filter(g1 => !guilds.some(g2 => g1.guild_id === g2.id));
  for (const guild of leftGuilds) {
    client.db.settings.deleteGuild.run(guild.guild_id);
    client.db.users.deleteGuild.run(guild.guild_id);

    client.logger.info(`Splite has left ${guild.guild_name}`);
  }

  //Slash Commands
  console.log("Setting up slash commands")
  client.guilds.cache.forEach(server => {
    // client.api.applications(client.user.id).guilds(server.id).commands('832797960407744513').delete()
      client.api.applications(client.user.id).guilds(server.id).commands.post({
        data: {
          name: "confess",
          description: "Post an anonymous confession",
          options: [
            {"name": "Confession",
              "description": "Type your confession",
              "type": 3,
              "required": true}
          ]
        }
      })
    });

  let reply = (interaction, response) => {
    client.api.interactions(interaction.id, interaction.token).callback.post({
    data: {
      type: 4,
      data: {
        content: response
      }
    }
  })}

    client.ws.on('INTERACTION_CREATE', async interaction => {
        const command = interaction.data.name.toLowerCase();
        if (command === 'confess') console.log("WORKED")
          const prefix = (client.db.settings.selectPrefix.pluck().get(interaction.guild_id))
          const confessionsChannelID = (client.db.settings.selectConfessionsChannelId.pluck().get(interaction.guild_id))
          const confession = interaction.data.options[0].value;
          const guild = client.guilds.cache.get(interaction.guild_id)
           if (!confessionsChannelID) {
               client.channels.cache.get(interaction.channel_id).send(`This server doesn't have a confessions channel. Create one by using \`${prefix}setconfessions #channel\``)
           }
           else {
             const confessionsChannel = client.channels.cache.get(confessionsChannelID)
             const embed = new MessageEmbed()
                   .setTitle('Anonymous Confession')
                   .setThumbnail(guild.iconURL({dynamic: true}))
                   .setDescription(`"${confession}"`)
                   .setFooter("Report ToS-breaking or hateful confessions by using /report [confessionID]")
                   .setTimestamp()
                   .setColor("RANDOM");
               confessionsChannel.send(embed).then(msg => {
                 var d = new Date();
                 var n = d.valueOf();
                 n = (n.toString())
                 n = n.slice(n.length - 6)

                 client.db.confessions.insertRow.run(
                     n,
                     confession,
                     interaction.member.user.id,
                     interaction.guild_id
                 );

                 const user = guild.members.cache.find(u => u.id === interaction.member.user.id)
                 user.send(`Your confession has been posted!\nhttps://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`).catch(()=>console.log(`Failed to DM after confessing!`))
           })}
  })


  client.logger.info('Splite is now online');
  client.logger.info(`Splite is running on ${client.guilds.cache.size} server(s)`);
};