const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class AvatarCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'avatar',
            aliases: ['profilepic', 'pic', 'av'],
            usage: 'avatar [user mention/ID]',
            description:
                'Displays a user\'s avatar (or your own, if no user is mentioned).',
            type: client.types.INFO,
            examples: ['avatar @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((option) =>
                option
                    .setName('user')
                    .setDescription('The user to display the avatar of.')
            ),
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args[0]) || message.member;

        this.handle(member, message);
    }

    interact(interaction) {
        const user = interaction.options.getUser('user') || interaction.member;
        this.handle(user, interaction, true);
    }

    handle(targetUser, context, isInteraction) {
        const embed = new MessageEmbed()
            .setAuthor({
                name: this.getUserIdentifier(targetUser),
                iconURL: this.getAvatarURL(targetUser),
            })
            .setDescription(`[Avatar URL](${this.getAvatarURL(targetUser)})`)
            .setTitle(`${this.getUserIdentifier(targetUser)}'s Avatar`)
            .setImage(this.getAvatarURL(targetUser))
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.member),
            })
            .setTimestamp()
            .setColor(targetUser.displayHexColor);

        if (isInteraction) return context.reply({embeds: [embed]});

        context.channel.send({embeds: [embed]});
    }

};
