const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {fail} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class BannerCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'banner',
            aliases: ['cover', 'b', 'bav'],
            usage: 'banner [user mention/ID]',
            description:
                'Displays a user\'s banner (or your own, if no user is mentioned).',
            type: client.types.INFO,
            examples: ['banner @split'],
            slashCommand: new SlashCommandBuilder().addUserOption((option) =>
                option
                    .setRequired(false)
                    .setName('user')
                    .setDescription('The user to display the banner of.')
            ),
        });
    }

    async run(message, args) {
        const member = await this.client.api.users((await this.getGuildMember(message.guild, args[0]))?.id || message.member.id).get();
        this.handle(member, message);
    }

    async interact(interaction) {
        await interaction.deferReply();

        const user = await this.client.api.users((interaction.options.getUser('user') || interaction.member)?.id).get();
        this.handle(user, interaction, true);
    }

    handle(targetUser, context, isInteraction) {
        const banner =
            targetUser.banner &&
            `https://cdn.discordapp.com/banners/${targetUser.id}/${targetUser.banner}${
                targetUser.banner.startsWith('a_') ? '.gif' : '.png'
            }?size=512`;

        const embed = new EmbedBuilder()
            .setTitle(`${this.getUserIdentifier(targetUser)}'s Banner`)
            .setFooter({
                text: this.getUserIdentifier(targetUser),
                iconURL: this.getAvatarURL(targetUser)
            })
            .setTimestamp();

        if (banner) embed.setImage(banner);
        else embed.setDescription(`${fail} **${targetUser.username}** has not setup their banner.`);

        const payload = {embeds: [embed]};

        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
