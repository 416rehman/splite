const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const jimp = require('jimp');

module.exports = class shipCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ship',
            aliases: ['love'],
            usage: 'ship <user mention/id>',
            description: 'Generates a ship image',
            type: client.types.FUN,
            examples: ['ship @split'],
        });
    }

    async run(message, args) {
        const member = await this.getGuildMember(message.guild, args[0] || this.client.db.users.getRandomWithBio.get(message.guild.id).user_id);
        const member2 = await this.getGuildMember(message.guild, args[1]) || message.author;

        if (!member || !member2) return this.sendErrorMessage(message, 0, 'Could not find the user you specified.');

        let shipOddsTime;
        if (
            member2.id === message.author.id ||
            member.id === message.author.id
        )
            shipOddsTime = message.guild.shippingOdds.get(message.author.id);
        let shipScore;
        if (shipOddsTime && new Date().getTime() - shipOddsTime < 1800000) {
            shipScore = message.client.utils.getRandomInt(85, 100);
        }
        else {
            const selector = message.client.utils.weightedRandom({0: 10, 1:20, 2:70});
            switch (selector) {
            case 0: {
                shipScore = message.client.utils.getRandomInt(0, 30);
                break;
            }
            case 1: {
                shipScore = message.client.utils.getRandomInt(30, 50);
                break;
            }
            default:
                shipScore = message.client.utils.getRandomInt(50, 100);
            }
        }

        if (shipScore < 5) shipScore = 0;
        try {
            shipScore = this.addToCollection(
                message,
                member2,
                member,
                shipScore
            );
            this.addToCollection(message, member, member2, shipScore);

            const progress =
                message.client.utils.createProgressBar(shipScore);
            const bg = await jimp.read('./data/ship/bgt.png');
            const av1 = await jimp.read(
                this.getAvatarURL(member2, 'png', true)
            );
            const av2 = await jimp.read(
                this.getAvatarURL(member, 'png', true)
            );
            const overlay = await jimp.read(
                shipScore > 50
                    ? './data/ship/overlay.png'
                    : './data/ship/bOverlay.png'
            );

            av1.resize(512, 512);
            av2.resize(512, 512);

            await bg.composite(av1, 0, 25);
            await bg.composite(av2, 610, 25);
            await bg.composite(overlay, 0, 0);

            bg.getBase64(jimp.AUTO, async function(e, img64) {
                const buff = new Buffer.from(img64.split(',')[1], 'base64');
                await message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor('LUMINOUS_VIVID_PINK')
                            .setDescription(
                                `\`${
                                    member2.user
                                        ? member2.user.username
                                        : member2.username
                                }\` ${
                                    shipScore > 50 ? emojis.match : emojis.unmatch
                                } \`${
                                    member.user
                                        ? member.user.username
                                        : member.username
                                }\`\n\n **${shipScore}%** ${progress} ${
                                    shipScore < 10
                                        ? 'Yiiikes!'
                                        : shipScore < 20
                                            ? 'Terrible 💩'
                                            : shipScore < 30
                                                ? 'Very Bad 😭'
                                                : shipScore < 40
                                                    ? 'Bad 😓'
                                                    : shipScore < 50
                                                        ? 'Worse Than Average 🤐'
                                                        : shipScore < 60
                                                            ? 'Average 😔'
                                                            : shipScore < 70
                                                                ? shipScore === 69
                                                                    ? 'NICE 🙈'
                                                                    : 'Above Average ☺'
                                                                : shipScore < 80
                                                                    ? 'Pretty Good 😳'
                                                                    : shipScore < 90
                                                                        ? 'Amazing 🤩'
                                                                        : shipScore < 100
                                                                            ? 'Extraordinary 😍'
                                                                            : 'Perfect 🤩😍🥰'
                                }`
                            )
                            // .attachFiles(new MessageAttachment(buff, 'ship.png'))
                            .setImage('attachment://ship.png'),
                    ],
                    files: [new MessageAttachment(buff, 'ship.png')],
                });
            });
        }
        catch (e) {
            console.log(e);
            message.channel.send({
                embeds: [
                    new MessageEmbed().setDescription(`${emojis.fail} ${e}`),
                ],
            });
        }
    }

    addToCollection(message, owner, child, shipScore) {
        if (
            message.guild.ships.has(owner.id) === false ||
            Date.now() - message.guild.ships.get(owner.id).time > 300000
        )
            message.guild.ships.set(owner.id, [
                {
                    userId: child.id,
                    shipScore,
                    time: Date.now(),
                },
            ]);
        else {
            let matchedBefore;
            let ships = message.guild.ships.get(owner.id);
            if (ships) {
                matchedBefore = ships.find((u) => u.userId === child.id);
                if (matchedBefore) shipScore = matchedBefore.shipScore;
                else ships.push({userId: child.id, shipScore, time: Date.now()});
            }
        }
        return shipScore;
    }
};
