const Command = require('../../Command.js');
const { MessageEmbed } = require('discord.js');

const { oneLine } = require('common-tags');
const emojis = require('../../../utils/emojis.json')

module.exports = class unmatchCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'unmatch',
      usage: 'unmatch',
      description: oneLine`
        Unmatch with someone you already matched with.
        
        Cost: Free
      `,
      type: client.types.SMASHORPASS,
      examples: ['smashorpass', 'sop', 'smash']
    });
  }
  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    if (args[0] !== undefined || args[0] != null)
    {
        let member;
        if (args[0].startsWith("<@")) member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
        else if ((/^[0-9]{18}$/g).test(args[0]))
        {
            member = message.guild.members.cache.get(args[0]);
            if (member === undefined)
            {
                const mRow = await message.client.db.users.selectRowUserOnly.get(args[0])
                const mGuild = await message.client.guilds.cache.get(mRow.guild_id)
                member = await mGuild.members.cache.get(mRow.user_id)
            }
        }
        else member = message.guild.members.cache.find(r=> r.user.username.toLowerCase().startsWith(args[0].toLowerCase()))

        if (member === undefined) return message.channel.send(`${emojis.fail} Failed to find the user. Please try again later.`)
        if (member.user.id === message.author.id) return message.channel.send(`${emojis.fail} NO :neutral_face:`)

        const match = message.client.db.SmashOrPass.getMatch.get({userId: member.user.id, userId2: message.author.id})
        if (match != null)
        {
            const embed = new MessageEmbed()
                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                .setDescription(`You will be unmatched ${emojis.unmatch} with ${member.user.username}\nDo you want to continue?`)
                .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            message.channel.send({embeds: [embed]})
                .then(async msg=>{
                    const reactions = await confirm(msg, message.author, ["✅", "❎"], 30000);

                    if(reactions === '✅')
                    {
                        message.client.db.SmashOrPass.unmatchUser.run({userId: message.author.id, unmatchUser: member.user.id})
                        await msg.edit({embeds: [new MessageEmbed()
                            .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                            .setDescription(`You have unmatched ${emojis.unmatch} with ${member.user.username}!`)]})
                    }
                    else return msg.delete();
                })
        }
        else {
            const embed = new MessageEmbed()
                .setTitle(`${emojis.smashorpass} Smash or Pass ${emojis.smashorpass}`)
                .setDescription(`You can't unmatch ${emojis.unmatch} someone you aren't matched with.`)

           return message.channel.send({embeds: [embed]}).then(m=>{
               setTimeout(() => m.delete(), 5000);
           })
        }

    }
    else message.reply(`Please mention a user, or provide a valid ID`).then(m=> {
        setTimeout(() => m.delete(), 5000);
    })
  }
};
