const Command = require('../Command.js');
const {EmbedBuilder} = require('discord.js');
const search = require('youtube-search');
const emoji = require('../../utils/emojis.json');
const {SlashCommandBuilder} = require('discord.js');
const {capitalize} = require('../../utils/utils');

module.exports = class YoutubeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'youtube',
            aliases: ['yt'],
            usage: 'youtube <video name>',
            description: 'Searches YouTube for the specified video.',
            type: client.types.FUN,
            examples: ['youtube That\'s a ten'],
            slashCommand: new SlashCommandBuilder().addStringOption(s => s.setName('text').setDescription('The video name to search for').setRequired(true))
        });
    }


    run(message, args) {
        const videoName = args.join(' ');
        if (!videoName)
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a YouTube video name'
            );

        this.handle(videoName, message, false);
    }

    async interact(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('text');
        await this.handle(text, interaction, true);
    }

    async handle(videoName, context) {
        try {
            const searchOptions = {maxResults: 1, key: this.client.config.apiKeys.googleApi, type: 'video'};
            if (!context.channel.nsfw) searchOptions['safeSearch'] = 'strict';

            let result = await search(videoName, searchOptions);

            result = result.results[0];
            const payload = 'Searched YouTube for **' + capitalize(videoName) + '**\n\n' + result.title + ' - ' + result.link
                || emoji.fail + ' ' + 'Unable to find video, please provide a different YouTube video name';

            await this.sendReply(context, payload);
        }
        catch (err) {
            const payload = {
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error')
                        .setDescription(err.message)
                ]
            };
            await this.sendReply(context, payload);
        }
    }
};
