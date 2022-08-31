const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class TotalPointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'totalpoints',
            aliases: ['totalp', 'tp'],
            usage: 'totalpoints <user mention/ID>',
            description:
                'Fetches a user\'s total points. If no user is given, your own total points will be displayed.',
            type: client.types.POINTS,
            examples: ['totalpoints @split'],
            slashCommand: new SlashCommandBuilder().addUserOption(u => u.setName('user').setDescription('The user to get the total points of.'))
        });
    }

    async run(message, args) {
        if (args.length === 0) {
            return message.reply(`${emojis.fail} You need to specify a user to get the total points of.`);
        }
        let target = await this.getGuildMember(message.guild, args[0]);
        if (!target) {
            return message.reply(`${emojis.fail} I couldn't find that user.`);
        }
        this.handle(target, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') || interaction.author;
        this.handle(target, interaction, true);
    }

    handle(member, context, isInteraction) {
        const points = this.client.db.users.selectTotalPoints
            .pluck()
            .get(member.id, context.guild.id);
        const embed = new MessageEmbed()
            .setTitle(`${this.getUserIdentifier(member)}'s Total Points`)
            .setThumbnail(this.getAvatarURL(member))
            .addField('Member', member.toString(), true)
            .addField(`Points ${emojis.point}`, `\`${points}\``, true)
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(member.displayHexColor);

        this.sendReply(context, {embeds: [embed]}, isInteraction);
    }
};
