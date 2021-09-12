const { MessageEmbed } = require('discord.js');

/**
 * Reaction Menu class
 */
class ReactionMenu {

  /**
   * Create new ReactionMenu
   * @param {Client} client
   * @param {TextChannel} channel
   * @param {GuildMember} member
   * @param {MessageEmbed} embed
   * @param {Array} arr
   * @param {int} interval
   * @param {Message} overwrite
   * @param {Object} reactions
   * @param {int} timeout
   */
  constructor(client, channel, member, embed, arr = null, interval = 10, overwrite = null, reactions = {
    '⏪': this.first.bind(this),
    '◀️': this.previous.bind(this),
    '▶️': this.next.bind(this),
    '⏩': this.last.bind(this),
    '⏹️': this.stop.bind(this)
  }, timeout = 120000) {

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
    this.interval = interval;

    /**
     * The current array window start
     * @type {int}
     */
    this.current = 0;

    /**
     * The max length of the array
     * @type {int}
     */
    this.max = (this.arr) ? arr.length : null;

    /**
     * The reactions for menu
     * @type {Object}
     */
    this.reactions = reactions;

    /**
     * The emojis used as keys
     * @type {Array<string>}
     */
    this.emojis = Object.keys(this.reactions);

    /**
     * The collector timeout
     * @type {int}
     */
    this.timeout = timeout;

    const first = new MessageEmbed(this.json);
    const description = (this.arr) ? this.arr.slice(this.current, this.interval) : null;

    if (description) first
        .setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.arr, this.current, this.interval))
        .setDescription(description.join('\n'));


    this.channel.send({embeds: [first]}).then(message => {

      /**
       * The menu message
       * @type {Message}
       */
      this.message = message;

      this.addReactions().then(r =>
          this.createCollector()
      );

    });
  }

  /**
   * Adds reactions to the message
   */
  async addReactions() {
    for (const emoji of this.emojis) {
      await this.message.react(emoji);
    }
  }

  /**
   * Creates a reaction collector
   */
  createCollector() {
    const filter = (reaction, user) => {
      return (this.emojis.includes(reaction.emoji.name) || this.emojis.includes(reaction.emoji.id)) &&
          user.id == this.memberId
    };

    // Create collector
    const collector = this.message.createReactionCollector({filter, time: this.timeout});

    // On collect
    collector.on('collect', async reaction => {
      let newPage =  this.reactions[reaction.emoji.name] || this.reactions[reaction.emoji.id];
      if (typeof newPage === 'function') newPage = newPage();
      if (newPage) await this.message.edit({embeds: [newPage]});
      await reaction.users.remove(this.memberId);
    });

    // On end
    collector.on('end', () => {
      this.message.reactions.removeAll();
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
        .setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.arr, this.current, this.interval))
        .setDescription(this.arr.slice(this.current, this.current + this.interval).join('\n'));
  }

  /**
   * Goes back an array interval
   */
  previous() {
    if (this.current === 0) return;
    this.current -= this.interval;
    if (this.current < 0) this.current = 0;
    return new MessageEmbed(this.json)
        .setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.arr, this.current, this.interval))
        .setDescription(this.arr.slice(this.current, this.current + this.interval).join('\n'));
  }

  /**
   * Goes to the next array interval
   */
  next() {
    const cap = this.max - (this.max % this.interval);
    if (this.current === cap || this.current + this.interval === this.max) return;
    this.current += this.interval;
    if (this.current >= this.max) this.current = cap;
    const max = (this.current + this.interval >= this.max) ? this.max : this.current + this.interval;
    return new MessageEmbed(this.json)
        .setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.arr, this.current, this.interval))
        .setDescription(this.arr.slice(this.current, max).join('\n'));
  }

  /**
   * Goes to the last array interval
   */
  last() {
    const cap = this.max - (this.max % this.interval);
    if (this.current === cap || this.current + this.interval === this.max) return;
    this.current = cap;
    if (this.current === this.max) this.current -= this.interval;
    return new MessageEmbed(this.json)
        .setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.arr, this.current, this.interval))
        .setDescription(this.arr.slice(this.current, this.max).join('\n'));
  }

  /**
   * Stops the collector
   */
  stop() {
    this.collector.stop();
  }
}

module.exports = {
  ReactionMenu
}