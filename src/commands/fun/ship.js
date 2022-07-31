const Command = require('../Command.js');
const {MessageEmbed, MessageAttachment} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const jimp = require('jimp');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {load} = require('../../utils/emojis.json');

module.exports = class shipCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ship',
            aliases: ['love'],
            usage: 'ship <user mention/id>',
            description: 'Generates a ship image',
            type: client.types.FUN,
            examples: ['ship @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('with').setRequired(false).setDescription('The user to ship with')).addUserOption(u => u.setName('user').setRequired(false).setDescription('The user to ship with')),
        });
    }

    async run(message, args) {
        const member = args[0] ? await this.getGuildMember(message.guild, args[0]) : message.guild.members.cache.random();
        const member2 = await this.getGuildMember(message.guild, args[1]) || message.author;

        if (!member || !member2) return this.sendErrorMessage(message, 0, 'Could not find the user you specified.');

        await message.channel
            .send({
                embeds: [new MessageEmbed().setDescription(`${load} Loading...`)],
            }).then(msg => {
                message.loadingMessage = msg;
                this.handle(member, member2, message, false);
            });
    }

    async interact(interaction) {
        await interaction.deferReply();

        let user = interaction.options.getUser('with') || interaction.guild.members.cache.random();
        const user2 = interaction.options.getUser('user') || interaction.author;

        this.handle(user, user2, interaction, true);
    }

    async handle(member, member2, context, isInteraction) {
        let shipOddsTime;
        if (member2.id === context.author.id || member.id === context.author.id)
            shipOddsTime = context.guild.shippingOdds.get(context.author.id);

        let shipScore;
        if (shipOddsTime && new Date().getTime() - shipOddsTime < 1800000) {
            shipScore = this.client.utils.getRandomInt(85, 100);
        }
        else {
            const selector = this.client.utils.weightedRandom({0: 10, 1: 20, 2: 70});
            switch (selector) {
            case 0: {
                shipScore = this.client.utils.getRandomInt(0, 30);
                break;
            }
            case 1: {
                shipScore = this.client.utils.getRandomInt(30, 50);
                break;
            }
            default:
                shipScore = this.client.utils.getRandomInt(50, 100);
            }
        }

        if (shipScore < 5) shipScore = 0;
        try {
            shipScore = this.addToCollection(context, member2, member, shipScore);
            this.addToCollection(context, member, member2, shipScore);

            const progress = this.client.utils.createProgressBar(shipScore);
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

            bg.getBase64(jimp.AUTO, function(e, img64) {
                const buff = new Buffer.from(img64.split(',')[1], 'base64');

                const payload = {
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
                };

                if (isInteraction) context.editReply(payload);
                else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
            });
        }
        catch (e) {
            console.error(e);
            const payload = {
                embeds: [
                    new MessageEmbed().setDescription(`${emojis.fail} ${e}`),
                ],
            };
            if (isInteraction) context.editReply(payload);
            else context.loadingMessage ? context.loadingMessage.edit(payload) : context.channel.send(payload);
        }

    }

    addToCollection(message, owner, child, shipScore) {
        const ownerId = owner?.id || owner?.user?.id;
        const childId = child?.id || child?.user?.id;

        if (
            message.guild.ships.has(ownerId) === false ||
            Date.now() - message.guild.ships.get(ownerId).time > 300000
        )
            message.guild.ships.set(ownerId, [
                {
                    userId: childId,
                    shipScore,
                    time: Date.now(),
                },
            ]);
        else {
            let matchedBefore;
            let ships = message.guild.ships.get(ownerId);
            if (ships) {
                matchedBefore = ships.find((u) => u.userId === child.id);
                if (matchedBefore) shipScore = matchedBefore.shipScore;
                else ships.push({userId: childId, shipScore, time: Date.now()});
            }
        }
        return shipScore;
    }
};
