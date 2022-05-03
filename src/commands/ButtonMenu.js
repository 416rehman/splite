const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');

/**
 * Reaction Menu class
 */
module.exports = class LeaderboardMenu {
    /**
     * Create new LeaderboardMenu
     * @param client Discord client instance
     * @param channel Discord channel to send message to
     * @param member The user to have the menu open for
     * @param embed The embed to use for the menu
     * @param arr Array of String of leaderboard entries
     * @param perPage Amount of entries to show per page
     * @param behaviorOverride Override the behavior of buttons, use null to use default behavior
     * @param timeout Timeout for the menu to close
     * @param components Any additional components to add to the menu
     * @param callback Callback function to call when the leaderboard is sent. Will be passed the sent message
     */
    constructor(
        client,
        channel,
        member,
        embed,
        arr = null,
        perPage = 10,
        behaviorOverride,
        timeout = 120000,
        components,
        callback = null
    ) {
        /**
         * The Client
         * @type {Client}
         */
        this.client = client;

        /**
         * The text channel
         * @type {TextChannel}
         */
        this.channel = channel;
        this.callback = callback;
        /**
         * The member ID snowflake
         * @type {string}
         */
        this.memberId = member.id;

        /**
         * The embed passed to the Reaction Menu
         * @type {MessageEmbed}
         */
        this.embed = embed;

        /**
         * JSON from the embed
         * @type {Object}
         */
        this.json = this.embed.toJSON();

        /**
         * The array to be iterated over
         * @type {Array}
         */
        this.arr = arr;

        /**
         * The size of each array window
         * @type {int}
         */
        this.interval = perPage;

        /**
         * The current array window start
         * @type {int}
         */
        this.current = 0;

        /**
         * The max length of the array
         * @type {int}
         */
        this.max = this.arr ? arr.length : null;

        /**
         * The buttons to be displayed
         * @type {MessageButton[]}
         */
        this.buttons = [
            new MessageButton()
                .setCustomId('first')
                .setLabel('⏮️')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('previous')
                .setLabel('◀️')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('next')
                .setLabel('▶️')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('last')
                .setLabel('⏭️')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('stop')
                .setLabel('⏹️')
                .setStyle('DANGER'),
        ];

        /**
         * The behaviorOverride for the buttons
         * @type {Object}
         */
        this.functions = behaviorOverride || {
            first: this.first.bind(this),
            previous: this.previous.bind(this),
            next: this.next.bind(this),
            last: this.last.bind(this),
            stop: this.stop.bind(this),
        };

        /**
         * The emojis used as keys
         * @type {Array<string>}
         */
        this.emojis = Object.keys(this.functions);

        /**
         * The collector timeout
         * @type {int}
         */
        this.timeout = timeout;

        const first = new MessageEmbed(this.json);
        const description = this.arr
            ? this.arr.slice(this.current, this.interval)
            : null;

        if (description)
            first
                .setTitle(
                    this.embed.title +
                    ' ' +
                    this.client.utils.getRange(
                        this.arr,
                        this.current,
                        this.interval
                    )
                )
                .setDescription(description.join('\n'));

        const row = new MessageActionRow();
        this.buttons.forEach((button) => row.addComponents(button));
        this.channel
            .send({
                embeds: [first],
                components: components ? [...components, row] : [row] || [],
            })
            .then((message) => {
                /**
                 * The sent message
                 * @type {Message}
                 */
                this.message = message;
                this.createCollector();

                if (this.callback) this.callback(message);
            });
    }

    /**
     * Creates a button collector
     */
    createCollector() {
        const filter = (button) => {
            button.deferUpdate();
            return button.user.id === this.memberId;
        };
        const collector = this.message.createMessageComponentCollector({
            filter,
            componentType: 'BUTTON',
            time: this.timeout,
        });

        // On collect
        collector.on('collect', async (btn) => {
            let newPage = this.functions[btn.customId];
            if (typeof newPage === 'function') newPage = newPage();
            if (newPage) await this.message.edit({embeds: [newPage]});
        });

        // On end
        collector.on('end', () => {
            this.message.edit({components: []});
        });

        this.collector = collector;
    }

    /**
     * Skips to the first array interval
     */
    first() {
        if (this.current === 0) return;
        this.current = 0;
        return new MessageEmbed(this.json)
            .setTitle(
                this.embed.title +
                ' ' +
                this.client.utils.getRange(this.arr, this.current, this.interval)
            )
            .setDescription(
                this.arr
                    .slice(this.current, this.current + this.interval)
                    .join('\n')
            );
    }

    /**
     * Goes back an array interval
     */
    previous() {
        if (this.current === 0) return;
        this.current -= this.interval;
        if (this.current < 0) this.current = 0;
        return new MessageEmbed(this.json)
            .setTitle(
                this.embed.title +
                ' ' +
                this.client.utils.getRange(this.arr, this.current, this.interval)
            )
            .setDescription(
                this.arr
                    .slice(this.current, this.current + this.interval)
                    .join('\n')
            );
    }

    /**
     * Goes to the next array interval
     */
    next() {
        const cap = this.max - (this.max % this.interval);
        if (this.current === cap || this.current + this.interval === this.max)
            return;
        this.current += this.interval;
        if (this.current >= this.max) this.current = cap;
        const max =
            this.current + this.interval >= this.max
                ? this.max
                : this.current + this.interval;
        return new MessageEmbed(this.json)
            .setTitle(
                this.embed.title +
                ' ' +
                this.client.utils.getRange(this.arr, this.current, this.interval)
            )
            .setDescription(this.arr.slice(this.current, max).join('\n'));
    }

    /**
     * Goes to the last array interval
     */
    last() {
        const cap = this.max - (this.max % this.interval);
        if (this.current === cap || this.current + this.interval === this.max)
            return;
        this.current = cap;
        if (this.current === this.max) this.current -= this.interval;
        return new MessageEmbed(this.json)
            .setTitle(
                this.embed.title +
                ' ' +
                this.client.utils.getRange(this.arr, this.current, this.interval)
            )
            .setDescription(this.arr.slice(this.current, this.max).join('\n'));
    }

    /**
     * Stops the collector
     */
    stop() {
        this.collector.stop();
    }
};
