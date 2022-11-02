const Command = require('../Command.js');
module.exports = class MusicBackCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'back',
            description: 'Go back to the previous track',
            aliases: ['previous'],
            usage: 'back',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
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
        const queue = this.client.player.getQueue(context.guild.id);

        if (!queue || !queue.playing)
            return this.sendReply(context, `No music currently playing ${context.author}... try again ? ❌`);

        if (!queue.previousTracks[1])
            return this.sendReply(context, `There was no music played before ${context.author}... try again ? ❌`);

        await queue.back();

        await this.sendReply(context, 'Playing the **previous** track ✅');
    }
};
