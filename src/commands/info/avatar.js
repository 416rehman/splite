const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = class AvatarCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'avatar',
            aliases: ['profilepic', 'pic', 'av'],
            usage: 'avatar [user mention/ID]',
            description: 'Displays a user\'s avatar (or your own, if no user is mentioned).',
            type: client.types.INFO,
            examples: ['avatar @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((option) =>
                option
                    .setRequired(false)
                    .setName('user')
                    .setDescription('The user to display the avatar of.')
            ),
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args.join(' ')) || message.member;

        this.handle(member, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') || interaction.member;
        this.handle(user, interaction);
    }

    handle(targetUser, context) {
        const embed = new MessageEmbed()
            .setAuthor({
                name: this.getUserIdentifier(targetUser),
                iconURL: this.getAvatarURL(targetUser),
            })
            .setDescription(`[Avatar URL](${this.getAvatarURL(targetUser)})`)
            .setTitle(`${this.getUserIdentifier(targetUser)}'s Avatar`)
            .setImage(this.getAvatarURL(targetUser))
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.member),
            })
            .setTimestamp()
            .setColor(targetUser.displayHexColor);

        this.sendReply(context, {embeds: [embed]});
    }
};
