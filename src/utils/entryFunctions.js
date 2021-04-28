const {MessageEmbed} = require('discord.js');

module.exports = {
    joinvoting: async function joinvoting(reaction, user, client, timer, duration, messageID, votingChannelID, emoji) {
        if (reaction.message.id === messageID) {
            let proceed = false;
            if (reaction.emoji.id) if(reaction.emoji.id === emoji) proceed = true;
            else if(reaction.emoji.name === emoji) proceed = true;
            if (proceed) {
                const {
                    voteRunning: voteStatus
                } = client.db.users.selectVoteRunning.get(reaction.message.channel.guild.id, user.id)
                if(voteStatus) return;
                let time = duration*1000;
                await user.send("Please wait, server members are deciding your fate.").catch(() => console.log("Can't send DM to your user!"));
                let embed = new MessageEmbed()
                    .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
                    .setColor(0xf25852)
                    .setTitle(`${user.username}#${user.discriminator} Is Attempting To Join Server`)
                    .setDescription(`Vote and decide their fate.\n
                **Should they stay?**\n`)
                    .setFooter(`Voting will end in ${duration} seconds...`);

                const channel = client.channels.cache.find(channel => channel.id === votingChannelID)
                channel.send(embed).then(msg => {
                    client.db.users.updateVoteRunning.run(1, user.id, msg.guild.id)
                    msg.react('👍').then(() => msg.react('👎'));

                    embed = new MessageEmbed()
                        .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
                        .setColor(0xf25852)
                        .setTitle(`${user.username}#${user.discriminator} Is Attempting To Join Server`)
                        .setDescription(`Vote and decide their fate.\n
                **Should they stay?**\n`)
                        .setFooter(`Voting will end in ${duration = duration - timer} seconds...`);

                    let myinterval = setInterval(() => {
                        msg.edit(embed).then(() => embed = new MessageEmbed()
                            .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
                            .setColor(0xf25852)
                            .setTitle(`${user.username}#${user.discriminator} Is Attempting To Join Server`)
                            .setDescription(`Vote and decide their fate.\n
                **Should they stay?**\n`)
                            .setFooter(`Voting will end in ${duration = duration - timer} seconds...`));
                    }, timer*1000);

                    const filter = (reaction) => {
                        return ['👍', '👎'].includes(reaction.emoji.name);
                    };
                    msg.awaitReactions(filter, {max: 9999, time: time, errors: ['time']})
                        .then(collected => {
                            const reaction = collected.first();
                        })
                        .catch(async collected => {
                            client.db.users.updateVoteRunning.run(0, user.id, reaction.message.channel.guild.id)
                            clearInterval(myinterval)
                            let yesVotes = (msg.reactions.cache.get('👍').count)
                            let noVotes = (msg.reactions.cache.get('👎').count)
                            if (noVotes > yesVotes) {
                                await user.send(`Sorry, you were voted off of the server. You received ${yesVotes} 👍 and ${noVotes} 👎`).catch(() => console.log("Can't send DM to your user!"));
                                try {await msg.guild.members.cache.get(user.id).ban({days: 0, reason: 'Minor - Voted Off'})}
                                catch{
                                    embed = new MessageEmbed()
                                        .setColor("RED")
                                        .setTitle(`Failed to ban ${user.username}#${user.discriminator}!`)
                                        .setImage("https://media4.giphy.com/media/ljtfkyTD3PIUZaKWRi/giphy.gif")
                                        .setDescription(`**Maybe they have higher perms than me?**\nThey received ${yesVotes} 👍 and ${noVotes} 👎`);
                                    msg.edit(embed)
                                    return;
                                }

                                embed = new MessageEmbed()
                                    .setColor("RED")
                                    .setTitle(`${user.username}#${user.discriminator} was voted off the server!`)
                                    .setImage("https://media.tenor.com/images/da66a96ca7f65f949a07db8ab9926297/tenor.gif")
                                    .setDescription(`They received ${yesVotes} 👍 and ${noVotes} 👎`);
                                msg.edit(embed)

                            } else {
                                await user.send('Welcome, enjoy your stay!.').catch(() => console.log("Can't send DM to your user!"));
                                embed = new MessageEmbed()
                                    .setColor("GREEN")
                                    .setImage("https://i.pinimg.com/originals/5e/78/af/5e78affab2547d678e4c5458dd931381.gif")
                                    .setTitle(`${user.username}#${user.discriminator} has been welcomed to the server!`)
                                    .setDescription(`They received ${yesVotes} 👍 and ${noVotes} 👎`);
                                msg.edit(embed)
                            }
                        });
                })
            }
        }
    }
}