const Command = require('../Command.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const {fail, load} = require("../../utils/emojis.json")
const mergeImages = require('merge-images');
const { Canvas, Image } = require('canvas');

module.exports = class shipCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'ship',
      aliases: ['love'],
      usage: 'ship <user mention/id>',
      description: 'Generates a ship image',
      type: client.types.FUN,
      examples: ['ship @split']
    });
  }
  async run(message, args) {
    if (message.guild.funInProgress.has(message.author.id)) return message.channel.send(new MessageEmbed().setDescription(`${fail} Please wait, you already have a request pending.`))
    message.guild.funInProgress.set(message.author.id, 'fun');
    const member = await this.getMemberFromMention(message, args[0]) || await message.guild.members.cache.get(args[0]) || message.guild.members.cache.random();
    const member2 = await this.getMemberFromMention(message, args[1]) || await message.guild.members.cache.get(args[1]) || message.author;

    message.channel.send(new MessageEmbed().setDescription(`${load} Shipping...`)).then(async msg=>{
      let shipScore = message.client.utils.getRandomInt(0, 100);
      try {
        if (message.guild.ships.has(member2.id) == false) message.guild.ships.set(message.author.id, [{userId: member.id, shipScore}])
        else
        {
          let ships = message.guild.ships.get(member2.id)
          console.log(ships)
          if (ships)
          {
            const matchedBefore = ships.find( u=> u.userId = member.id)
            if (matchedBefore) shipScore = matchedBefore.shipScore;
            else ships.push({userId: member.id, shipScore})
          }
        }
        console.log(member2)
        console.log()

        const progress = message.client.utils.createProgressBar(shipScore)
        const b62 = await mergeImages([
          { src: '/root/splite/data/ship/bgt.png', x:0, y:0 },
          { src: this.getAvatarURL(member, false), x: 2, y: 25 },
          { src: this.getAvatarURL(member2, false), x: 607, y: 25 },
          shipScore < 50 ? '/root/splite/data/ship/bOverlay.png' : '/root/splite/data/ship/overlay.png'
        ], {
          Canvas: Canvas,
          Image: Image
        })
        const buff = new Buffer.from(b62.split(",")[1], "base64")
        await msg.edit(new MessageEmbed()
            .setDescription(`\`${member.username}\` X \`${member2.displayName}\`\n **${shipScore}%** ${progress} ${shipScore < 10 ? 'Yiiikes!' : shipScore < 20 ? 'Terrible 💩' : shipScore < 30 ? 'Very Bad 😭' : shipScore < 40 ? 'Bad 😓' : shipScore < 50 ? 'Worse Than Average 🤐' : shipScore < 60 ? 'Average 😔' : shipScore < 70 ? shipScore === 69 ? 'NICE 🙈' : 'Above Average ☺' : shipScore < 80 ? 'Pretty Good 😳' : shipScore < 90 ? 'Amazing 🤩' : shipScore < 100 ? 'Extraordinary 😍' : 'Perfect 🤩😍🥰'}`)
            .attachFiles(new MessageAttachment(buff, 'bg.png'))
            .setImage('attachment://bg.png'))
      }
      catch(e) {
        console.log(e)
        msg.edit(new MessageEmbed().setDescription(`${fail} ${e}`))
      }
      const ships = message.guild.ships.get(message.author.id)
      if (ships) ships.push({userId: member2.id, shipScore})
    })
    message.guild.funInProgress.delete(message.author.id)
  }
};