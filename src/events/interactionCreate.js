const {MessageEmbed} = require('discord.js');
module.exports = async (client, interaction) => {
    if (interaction.isCommand()) {
        let command = client.commands.get(interaction.commandName);
        if (command.slashCommand) {
            const cooldown = await command.isOnCooldown(interaction.user.id)
            if (cooldown)
                return interaction.reply({
                    embeds: [new MessageEmbed().setDescription(`You are on a cooldown. Try again in **${cooldown}** seconds.`)],
                    ephemeral: true
                });

            const instanceExists = command.isInstanceRunning(interaction.user.id)
            if (instanceExists)
                return interaction.reply({
                    embeds: [new MessageEmbed().setDescription(`Command already in progress, please wait for it.`)],
                    ephemeral: true
                })

            const author = await interaction.guild.members.cache.get(interaction.user.id);
            const channel = await interaction.guild.channels.cache.get(interaction.channelId);

            const permissionErrors = command.checkPermissionErrors(author, channel, interaction.guild);
            if (!permissionErrors) return interaction.reply({
                content: `**This command can only be used by the bot creator.**`,
                ephemeral: true
            });
            if (permissionErrors instanceof MessageEmbed) return interaction.reply({
                embeds: [permissionErrors],
                ephemeral: true
            })

            let disabledCommands = client.db.settings.selectDisabledCommands.pluck().get(interaction.guild.id) || [];
            if (typeof (disabledCommands) === 'string') disabledCommands = disabledCommands.split(' ');

            if (!disabledCommands?.includes(command.name)) {
                if (!command.checkNSFW(channel)) {
                    return interaction.reply({
                        embeds: [new MessageEmbed()
                            .setAuthor({
                                name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                iconURL: command.getAvatarURL(interaction.user)
                            })
                            .setDescription(`NSFW Commands can only be run in NSFW channels.`)
                            .setTimestamp()
                            .setColor("RED")], ephemeral: true
                    })
                }

                command.setCooldown(interaction.user.id);
                command.setInstance(interaction.user.id);

                return command.interact(interaction, interaction.options._hoistedOptions || null); // Run command
            }
        }
    }
}
