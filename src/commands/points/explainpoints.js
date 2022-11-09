const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {stripIndent} = require('common-tags');
const emojis = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class ExplainPointsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'explainpoints',
            aliases: ['explainp', 'ep', 'howtopoints', 'h2points'],
            usage: 'explainpoints',
            description: `Explains the various aspects about ${client.name}'s points and crown systems.`,
            type: client.types.POINTS,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        this.handle(interaction, true);
    }

    handle(context) {
        // Get disabled leaderboard
        let disabledCommands =
            this.client.db.settings.selectDisabledCommands
                .pluck()
                .get(context.guild.id) || [];
        if (typeof disabledCommands === 'string')
            disabledCommands = disabledCommands.split(' ');

        const prefix = this.client.db.settings.selectPrefix
            .pluck()
            .get(context.guild.id); // Get prefix
        const {
            context_points: contextPoints,
            command_points: commandPoints,
            voice_points: voicePoints,
        } = this.client.db.settings.selectPoints.get(context.guild.id);

        // Points per
        let earningPoints =
            stripIndent`You can earn points (${emojis.point}) in the following ways: by sending **contexts**, by using **commands**,` +
            ` playing geoGuessr, playing trivia, and spending time in **voice chat** ${emojis.voice}.`;
        if (!disabledCommands.includes('givepoints'))
            earningPoints += ` And if someone's feeling generous, they can give you points ${emojis.point} by using the \`${prefix}give\` command.\nAdditionally, points can be used to send anonymous contexts (Type **\`/anonymous\`**) in a server if allowed by admins.`;

        const pointsPer = stripIndent`
      context Points   :: ${contextPoints} points per context
      Command Points   :: ${commandPoints} points per command
      Voice Points     :: ${voicePoints} points per minute
      GeoGuessr Points :: 10 points per correct answer
      Trivia Points    :: 10 points per correct answer
    `;

        earningPoints += ` Here is this server's ${emojis.point} **points per action**:\n\`\`\`asciidoc\n${pointsPer}\`\`\``;

        if (!disabledCommands.includes('pointsper'))
            earningPoints += `
        To quickly see your server's ${emojis.point} points per action again, you may use the command \`${prefix}pointsper\`.
      `;

        // Checking points
        let checkingPoints = '';

        if (!disabledCommands.includes('points'))
            checkingPoints += `\nTo see current points ${emojis.point}, use the \`${prefix}points\` command.`;

        if (!disabledCommands.includes('totalpoints'))
            checkingPoints += ` To see overall points ${emojis.point}, use the \`${prefix}totalpoints\` command.`;

        // The Leaderboard
        let leaderboard = '';

        if (!disabledCommands.includes('position'))
            leaderboard += ` To check leaderboard standing, use the \`${prefix}position\` command.`;

        if (!disabledCommands.includes('leaderboard'))
            leaderboard += ` To see the leaderboard itself, use the \`${prefix}leaderboard\` command.`;

        // The Crown
        let crown =
            stripIndent`
      If a \`crown role\` ${emojis.crown} is set, then the person with the most points every 24 hours will win!` +
            ` Additionally, everyone's points ${emojis.point} will be reset to **0** (total points will remain untouched).
    `;

        if (!disabledCommands.includes('crown'))
            crown += `\nUse the \`${prefix}crown\` command for server specific information.`;

        const embed = new EmbedBuilder()
            .setTitle(`${emojis.point} Points and Crown ${emojis.crown}`)
            .setThumbnail(context.guild.iconURL({dynamic: true}))
            .addFields([{name: `Earning Points ${emojis.point}`, value:  earningPoints}])
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();
        if (checkingPoints)
            embed.addFields([{name: `Checking Points ${emojis.point}`, value:  checkingPoints}]);
        if (leaderboard) embed.addFields([{name: 'The Leaderboard', value:  leaderboard}]);
        embed.addFields([{name: `The Crown ${emojis.crown}`, value:  crown}]);


        const payload = {embeds: [embed]};
        this.sendReply(context, payload);
    }
};
