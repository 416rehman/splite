const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const {pong} = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            usage: 'ping',
            description: `Gets ${client.name}'s current latency and API latency.`,
            type: client.types.INFO,
            slashCommand: new SlashCommandBuilder()
        });
    }

    run(message) {
        this.handle(message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        await this.handle(interaction);
    }

    async handle(context) {
        const embed = new EmbedBuilder()
            .setDescription('`Pinging...`');

        let msg;
        let payload = {embeds: [embed]};
        msg = await this.sendReply(context, payload);

        const timestamp = context.editedTimestamp
            ? context.editedTimestamp
            : context.createdTimestamp; // Check if edited
        const latency = `\`\`\`ini\n[ ${Math.floor(
            msg.createdTimestamp - timestamp
        )}ms ]\`\`\``;
        const apiLatency = `\`\`\`ini\n[ ${Math.round(
            this.client.ws.ping
        )}ms ]\`\`\``;

        embed
            .setTitle(`Pong!  ${pong}`)
            .setDescription(null)
            .addFields([{name: 'Latency', value:  latency, inline:  true}])
            .addFields([{name: 'API Latency', value:  apiLatency, inline:  true}])
            .setFooter({
                text: this.getUserIdentifier(context.author),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp();

        payload = {embeds: [embed]};
        msg.edit(payload);
    }
};
