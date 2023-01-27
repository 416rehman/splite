const {EmbedBuilder} = require('discord.js');

module.exports = (client, oldMember, newMember) => {
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${newMember.user.tag}`,
            iconURL: newMember?.user?.displayAvatarURL({format: 'png', dynamic: true}),
        })
        .setTimestamp()
        .setColor(oldMember.guild.members.me.displayHexColor);

    // Nickname change
    if (oldMember.nickname != newMember.nickname) {
        // Get nickname log
        const nicknameLogId = client.db.settings.selectNicknameLogId
            .pluck()
            .get(oldMember.guild.id);
        const nicknameLog = oldMember.guild.channels.cache.get(nicknameLogId);
        if (
            nicknameLog &&
            nicknameLog.viewable &&
            nicknameLog
                .permissionsFor(oldMember.guild.members.me)
                .has(['SendMessages', 'EmbedLinks'])
        ) {
            const oldNickname = oldMember.nickname || '`None`';
            const newNickname = newMember.nickname || '`None`';
            embed
                .setTitle('Member Update: `Nickname`')
                .setDescription(`${newMember}'s **nickname** was changed.`)
                .addFields([{name: 'Nickname', value: `${oldNickname} ➔ ${newNickname}`}]);
            nicknameLog.send({embeds: [embed]});
        }
    }

    // Role add
    if (oldMember.roles.cache.size < newMember.roles.cache.size) {
        // Get role log
        const roleLogId = client.db.settings.selectRoleLogId
            .pluck()
            .get(oldMember.guild.id);
        const roleLog = oldMember.guild.channels.cache.get(roleLogId);
        if (
            roleLog &&
            roleLog.viewable &&
            roleLog
                .permissionsFor(oldMember.guild.members.me)
                .has(['SendMessages', 'EmbedLinks'])
        ) {
            const role = newMember.roles.cache
                .difference(oldMember.roles.cache)
                .first();
            embed
                .setTitle('Member Update: `Role Add`')
                .setDescription(`${newMember} was **given** the ${role} role.`);
            roleLog.send({embeds: [embed]});
        }
    }

    // Role remove
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
        // Get role log
        const roleLogId = client.db.settings.selectRoleLogId
            .pluck()
            .get(oldMember.guild.id);
        const roleLog = oldMember.guild.channels.cache.get(roleLogId);
        if (
            roleLog &&
            roleLog.viewable &&
            roleLog
                .permissionsFor(oldMember.guild.members.me)
                .has(['SendMessages', 'EmbedLinks'])
        ) {
            const role = oldMember.roles.cache
                .difference(newMember.roles.cache)
                .first();
            embed
                .setTitle('Member Update: `Role Remove`')
                .setDescription(`${newMember} was **removed** from ${role} role.`);
            roleLog.send({embeds: [embed]});
        }
    }
};
