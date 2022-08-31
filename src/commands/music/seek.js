const ms = require('ms');
const Command = require('../Command');

module.exports = class MusicSeekCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'seek',
            aliases: [],
            usage: 'seek [time]',
            voiceChannelOnly: true,
            type: client.types.MUSIC,
        });
    }

    run(message, args) {
        this.handle(args.join(' '), message);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const time = interaction.options.getString('time') || null;
        this.handle(time, interaction);
    }

    async handle(time, context) {
        const queue = this.client.player.getQueue(context.guild.id);

        if (!queue || !queue.playing)
            return this.sendReplyAndDelete(context,
                `No music currently playing ${context.author}... try again ? ❌`
            );

        const timeToMS = ms(time);

        if (timeToMS >= queue.current.durationMS)
            return this.sendReplyAndDelete(context,
                `The indicated time is higher than the total time of the current song ${context.author}... try again ? ❌\n*Try for example a valid time like **5s, 10s, 20 seconds, 1m**...*`
            );

        await queue.seek(timeToMS);

        this.sendReplyAndDelete(context,
            `Time set on the current song **${ms(timeToMS, {long: true})}** ✅`
        );
    }
};
