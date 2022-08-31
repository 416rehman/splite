const {MessageEmbed} = require('discord.js');

module.exports = {
    joinvoting: async function joinvoting(reaction, user, client, timer, duration, messageID, votingChannelID, emoji) {
        if (reaction.message.id === messageID) {
            if ((reaction.emoji.id && reaction.emoji.id === emoji) || reaction.emoji.name === emoji) {
                if (reaction.message.guild.JoinVotingInProgress.has(user.id)) return;
                reaction.message.guild.JoinVotingInProgress.set(user.id, new Date().getTime().toString());
                let time = duration * 1000;
                await user
                    .send('Please wait, server members are deciding your fate.')
                    .catch(() => console.log('Can\'t send DM to your user!'));

                let embed = new MessageEmbed()
                    .setThumbnail(this.getAvatarURL(user))
                    .setColor(0xf25852)
                    .setTitle(`${user.username}#${user.discriminator} Is Attempting To Join Server`)
                    .setDescription(`Vote and decide their fate.\n
                **Should they stay?**\n`)
                    .setFooter({
                        text: `Voting will end in ${duration} seconds...`,
                    });
                const channel = client.channels.cache.find((channel) => channel.id === votingChannelID);
                channel.send({embeds: [embed]}).then((msg) => {
                    msg.react('👍').then(() => msg.react('👎'));

                    embed
                        .setThumbnail(this.getAvatarURL(user))
                        .setColor(0xf25852)
                        .setTitle(`${user.username}#${user.discriminator} Is Attempting To Join Server`)
                        .setDescription(`Vote and decide their fate.\n
                **Should they stay?**\n`)
                        .setFooter({
                            text: `Voting will end in ${(duration = duration - timer)} seconds...`,
                        });

                    let myinterval = setInterval(() => {
                        msg.edit({embeds: [embed]}).then(() => embed
                            .setThumbnail(this.getAvatarURL(user))
                            .setColor(0xf25852)
                            .setTitle(`${user.username}#${user.discriminator} Is Attempting To Join Server`)
                            .setDescription(`Vote and decide their fate.\n
                **Should they stay?**\n`)
                            .setFooter({
                                text: `Voting will end in ${(duration = duration - timer)} seconds...`,
                            }));
                    }, timer * 1000);

                    const filter = (reaction) => {
                        return ['👍', '👎'].includes(reaction.emoji.name);
                    };

                    const collector = msg.createReactionCollector({filter, time});
                    collector.on('end', async (collected) => {
                        reaction.message.guild.JoinVotingInProgress.delete(user.id);
                        clearInterval(myinterval);
                        let yesVotes = collected.get('👍').count;
                        let noVotes = collected.get('👎').count;
                        if (noVotes > yesVotes) {
                            await user
                                .send(`Sorry, you were voted off of the server. You received ${yesVotes} 👍 and ${noVotes} 👎`)
                                .catch(() => console.log('Can\'t send DM to your user!'));
                            try {
                                const target = await msg.guild.members.fetch(user.id);
                                if (target.bannable) {
                                    await target.ban({
                                        days: 0, reason: `${client.name} JoinVoting - Voted Off`,
                                    });
                                }
                                else {
                                    embed
                                        .setColor('RED')
                                        .setTitle(`Failed to ban ${user.username}#${user.discriminator}!`)
                                        .setImage('https://media4.giphy.com/media/ljtfkyTD3PIUZaKWRi/giphy.gif')
                                        .setDescription(`**Maybe they have higher perms than me?**\nThey received ${yesVotes} 👍 and ${noVotes} 👎`);
                                    return msg.edit({embeds: [embed]});
                                }
                            }
                            catch {
                                embed
                                    .setColor('RED')
                                    .setTitle(`Failed to ban ${user.username}#${user.discriminator}!`)
                                    .setImage('https://media4.giphy.com/media/ljtfkyTD3PIUZaKWRi/giphy.gif')
                                    .setDescription(`**Maybe they have higher perms than me?**\nThey received ${yesVotes} 👍 and ${noVotes} 👎`);
                                return msg.edit({embeds: [embed]});
                            }

                            embed
                                .setColor('RED')
                                .setTitle(`${user.username}#${user.discriminator} was voted off the server!`)
                                .setImage('https://media.tenor.com/images/da66a96ca7f65f949a07db8ab9926297/tenor.gif')
                                .setDescription(`They received ${yesVotes} 👍 and ${noVotes} 👎`);
                            return msg.edit({embeds: [embed]});
                        }
                        else {
                            await user
                                .send('Welcome, enjoy your stay!.')
                                .catch(() => console.log('Can\'t send DM to your user!'));
                            embed
                                .setColor('GREEN')
                                .setImage('https://i.pinimg.com/originals/5e/78/af/5e78affab2547d678e4c5458dd931381.gif')
                                .setTitle(`${user.username}#${user.discriminator} has been welcomed to the server!`)
                                .setDescription(`They received ${yesVotes} 👍 and ${noVotes} 👎`);
                            msg.edit({embeds: [embed]});
                        }
                    });
                });
            }
        }
    },
};
