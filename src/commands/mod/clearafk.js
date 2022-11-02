const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class clearafkCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'clearafk',
            usage: 'clearafk',
            description: 'Clears a user\'s afk status.',
            type: client.types.INFO,
            examples: ['clearafk'],
            clientPermissions: [],
            userPermissions: ['MUTE_MEMBERS'],
            slashCommand: new SlashCommandBuilder()
                .addUserOption(u => u.setName('user').setDescription('The user to clear their afk status').setRequired(true))
        });
    }

    async run(message, args) {
        const member =
            await this.getGuildMember(message.guild, args.join(' '));

        if (!member.id)
            return message.reply(
                'Please provide a valid member to clear their afk status.'
            );

        this.handle(member, message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getMember('user');
        this.handle(user, interaction);
    }

    handle(member, context) {
        this.client.db.users.updateAfk.run(
            null,
            0,
            member.id,
            context.guild.id
        );

        if (member.nickname) member.setNickname(`${member.nickname.replace('[AFK]', '')}`);


        const embed = new EmbedBuilder()
            .setTitle('Clear AFK')
            .setDescription(`${member}'s AFK status was successfully cleared.`)
            .addFields([{name: 'Moderator', value:  context.member.toString(), inline:  true}])
            .addFields([{name: 'Member', value:  member.toString(), inline:  true}])
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.members.me.displayHexColor);

        this.sendReply(context, {embeds: [embed]});
        this.sendModLogMessage(context, null, {Member: member.toString()});
    }
};
