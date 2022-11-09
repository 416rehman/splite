const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class GenerateCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'generator1-group',
            description: 'Image generator 1',
            type: client.types.FUN,
            slashCommand: new SlashCommandBuilder().setName('image-generator')
                .addSubcommand((o) => o.setName('approved').setDescription('Generate an approved image from a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the approved image for')))
                .addSubcommand((o) => o.setName('awooify').setDescription('Awooify a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to awooify')))
                .addSubcommand((o) => o.setName('baguette').setDescription('Generate a baguette image from a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the baguette image for')))
                .addSubcommand((o) => o.setName('beautiful').setDescription('Generate a beautiful image from a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the beautiful image for')))
                .addSubcommand((o) => o.setName('brazzers').setDescription('Add a brazzers logo to from a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to add the brazzers logo to')))
                .addSubcommand((o) => o.setName('burn').setDescription('Add a burning effect to from a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to add the burning effect to')))
                .addSubcommand((o) => o.setName('challenger').setDescription('Generate a challenger image from a user\'s avatar').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the challenger image for')))
                .addSubcommand((o) => o.setName('changemymind').setDescription('Create a changemymind image with a text').addStringOption(uo => uo.setRequired(true).setName('text').setDescription('The text to use in the changemymind image')))
                .addSubcommand((o) => o.setName('clyde').setDescription('Generate a discord clyde bot message from text').addStringOption(uo => uo.setRequired(true).setName('text').setDescription('The text to use in the clyde bot message')))
                .addSubcommand((o) => o.setName('crush').setDescription('Generate a crush image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the crush image for')))
                .addSubcommand((o) => o.setName('dictator').setDescription('Generate a dictator image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the dictator image for')))
                .addSubcommand((o) => o.setName('fire').setDescription('Generate a spongebob fire image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the spongebob fire image for')))
                .addSubcommand((o) => o.setName('hate').setDescription('Generate a hate image').addStringOption(uo => uo.setRequired(true).setName('text').setDescription('The text to use in the hate image')))
                .addSubcommand((o) => o.setName('instagram').setDescription('Generate an instagram image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the instagram image for')))
                .addSubcommand((o) => o.setName('jail').setDescription('Generate a jail image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the jail image for')))
                .addSubcommand((o) => o.setName('missionpassed').setDescription('Generate a mission passed image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the mission passed image for')))
                .addSubcommand((o) => o.setName('moustache').setDescription('Add a moustache to an image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to add the moustache to')))
                .addSubcommand((o) => o.setName('ps4').setDescription('Generate a ps4 image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the ps4 image for')))
                .addSubcommand((o) => o.setName('rejected').setDescription('Generate a rejected image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the rejected image for')))
                .addSubcommand((o) => o.setName('rip').setDescription('Generate a rip image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the rip image for')))
                .addSubcommand((o) => o.setName('scary').setDescription('Generate a scary image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the scary image for')))
                .addSubcommand((o) => o.setName('sniper').setDescription('Generate a sniper image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the sniper image for')))
                .addSubcommand((o) => o.setName('thanos').setDescription('Generate a thanos image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the thanos image for')))
                .addSubcommand((o) => o.setName('threats').setDescription('Generate a threats image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the threats image for')))
                .addSubcommand((o) => o.setName('tobecontinued').setDescription('Generate a to be continued image').addUserOption(uo => uo.setRequired(false).setName('user').setDescription('The user to generate the to be continued image for')))
        });
    }
};
