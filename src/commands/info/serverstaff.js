const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class ServerStaffCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'serverstaff',
            aliases: ['staff', 'admins', 'mods'],
            usage: 'serverstaff',
            description:
                'Displays a list of all current server moderators and admins.',
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder().setName('staff')
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context, isInteraction) {
        // Get mod role
        const modRoleId = this.client.db.settings.selectModRoleId
            .pluck()
            .get(context.guild.id);
        let modRole, mods;
        if (modRoleId) modRole = context.guild.roles.cache.get(modRoleId);

        // Get admin role
        const adminRoleId = this.client.db.settings.selectAdminRoleId
            .pluck()
            .get(context.guild.id);
        let adminRole, admins;
        if (adminRoleId) adminRole = context.guild.roles.cache.get(adminRoleId);

        let modList = [],
            adminList = [];

        // Get mod list
        if (modRole)
            modList = [
                ...modRole.members.sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
                    .values()
            ];

        if (modList.length > 0)
            mods = this.client.utils.trimStringFromArray(modList, 1024);
        else if (!modRole) mods = 'No Mod Role is set. Please use /setmodrole';
        else mods = 'No mods found.';

        // Get admin list
        if (adminRole)
            adminList = [
                ...adminRole.members.sort((a, b) => (a.joinedAt > b.joinedAt ? 1 : -1))
                    .values()
            ];

        if (adminList.length > 0)
            admins = this.client.utils.trimStringFromArray(adminList, 1024);
        else if (!adminRole) admins = 'No Admin Role is set. Please use /adminrole command';
        else admins = 'No admins found.';

        const embed = new EmbedBuilder()
            .setTitle(`Server Staff List [${modList.length + adminList.length}]`)
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addFields([{name: `Admins [${adminList.length}]`, value:  admins, inline:  true}])
            .addFields([{name: `Mods [${modList.length}]`, value:  mods, inline:  true}])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        const payload = {embeds: [embed]};
        if (isInteraction) context.editReply(payload);
        else context.loadingMessage ? context.loadingMessage.edit(payload) : context.reply(payload);
    }
};
