const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { confirm } = require("djs-reaction-collector")
const { oneLine } = require('common-tags');

module.exports = class unmatchCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'unmatch',
      usage: 'unmatch',
      description: oneLine`
        Unmatch with someone you already matched with.
        
        Cost: Free
      `,
      type: client.types.FUN,
      examples: ['smashorpass', 'sop', 'smash']
    });
  }
  async run(message, args) {
    const prefix = message.client.db.settings.selectPrefix.pluck().get(message.guild.id);
    if (args[0] !== undefined || args[0] != null)
    {
        const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0] || await message.guild.members.cache.find(m=>m.displayName.toLowerCase().startsWith(args[0].toLowerCase())));
        const match = message.client.db.matches.getMatch.get(message.author.id, member.user.id)
        if (match != null || match !== undefined)
        {
            const embed = new MessageEmbed()
                .setTitle(`🔥 Smash or Pass 👎`)
                .setDescription(`You will be unmatched with ${member.user.username}\nDo you want to continue?`)
                .setImage(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            message.reply()
                .then(async msg=>{
                    const reactions = await confirm(msg, message.author, ["✅", "❎"], 30000);

                    if(reactions === '✅')
                    {
                        message.client.db.matches.unmatchUser.run(message.author.id, member.user.id)
                        msg.edit(`You have unmatched with ${member.user.username}!`, {embed: null})
                        msg.delete({timeout: 5000})
                    }
                    else return msg.delete({timeout: 5000});
                })
        }
    }


  }
};
