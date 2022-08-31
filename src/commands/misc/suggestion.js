const Command = require('../Command.js');
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');
const {SlashCommandBuilder} = require('@discordjs/builders');
const emojis = require('../../utils/emojis.json');

module.exports = class FeedbackCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'suggest',
            aliases: ['fb', 'suggestions', 'suggestion', 'feedback'],
            usage: 'suggest <message>',
            description: `Sends a message to the ${client.name} developers feedback page.`,
            type: client.types.MISC,
            examples: [`suggest We love ${client.name}!`],
            slashCommand: new SlashCommandBuilder().addStringOption(m => m.setName('feedback').setDescription('The feedback message').setRequired(true)),
            disabled: !client.config.feedbackChannelId
        });
    }

    async interact(interaction) {
        await interaction.deferReply();
        const feedback = interaction.options.getString('feedback');
        this.handle(feedback, interaction, true);
    }

    run(message, args) {
        if (!args[0])
            return this.sendErrorMessage(
                message,
                0,
                'Please provide a message to send'
            );
        let feedback = message.content.slice(
            message.content.indexOf(args[0]),
            message.content.length
        );

        this.handle(feedback, message, false);
    }

    handle(feedback, context, isInteraction) {
        const feedbackChannel = this.client.channels.cache.get(this.client.config.feedbackChannelId);
        if (!feedbackChannel) {
            this.sendReplyAndDelete(context, `${emojis.fail} This bot is not setup to send feedback.`, isInteraction);
        }

        // Send report
        const feedbackEmbed = new MessageEmbed()
            .setTitle('Suggestion')
            .setThumbnail(feedbackChannel.guild.iconURL({dynamic: true}))
            .setDescription(feedback)
            .addField('User', context.member.toString(), true)
            .addField('Server', context.guild.name, true)
            .setFooter({
                text: this.getUserIdentifier(context.member),
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        feedbackChannel.send({embeds: [feedbackEmbed]});

        // Send response
        if (feedback.length > 1024) feedback = feedback.slice(0, 1021) + '...';
        const embed = new MessageEmbed()
            .setTitle('Suggestion')
            .setThumbnail('https://i.imgur.com/B0XSinY.png')
            .setDescription(
                oneLine`
        Successfully sent feedback!
        ${this.client.owners[0] && `To further discuss your feedback, contact ${this.client.owners[0]}`}`)
            .addField('Member', context.member.toString(), true)
            .addField('Message', feedback)
            .setFooter({
                text: context.member.displayName,
                iconURL: this.getAvatarURL(context.author),
            })
            .setTimestamp()
            .setColor(context.guild.me.displayHexColor);

        this.sendReply(context, {embeds: [embed]}, isInteraction);
    }
};
