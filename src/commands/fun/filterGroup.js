const Command = require('../Command.js');
const {SlashCommandBuilder} = require('discord.js');

module.exports = class FilterCommandGroup extends Command {
    constructor(client) {
        super(client, {
            name: 'imagefilter-group',
            description: 'Apply a filter to an image',
            type: client.types.FUN,
            slashCommand: new SlashCommandBuilder().setName('image-filter')
                .addSubcommand((o) => o.setName('blur').setDescription('Blur an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to blur')))
                .addSubcommand((o) => o.setName('blurple').setDescription('Blurple an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply blurple filter to')))
                .addSubcommand((o) => o.setName('contrast').setDescription('Add a contrast effect to an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply contrast filter to')))
                .addSubcommand((o) => o.setName('circle').setDescription('Crop an image to a circle').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar crop to circle')))
                .addSubcommand((o) => o.setName('deepfry').setDescription('Deepfry an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to deepfry')))
                .addSubcommand((o) => o.setName('distort').setDescription('Distort an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to distort')))
                .addSubcommand((o) => o.setName('emboss').setDescription('Emboss an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to emboss')))
                .addSubcommand((o) => o.setName('gay').setDescription('Add a rainbow effect to an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply rainbow filter to')))
                .addSubcommand((o) => o.setName('glitch').setDescription('Glitch an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to glitch')))
                .addSubcommand((o) => o.setName('greyple').setDescription('Greyple an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply greyple filter to')))
                .addSubcommand((o) => o.setName('greyscale').setDescription('Greyscale an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply greyscale filter to')))
                .addSubcommand((o) => o.setName('invert').setDescription('Invert an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to invert')))
                .addSubcommand((o) => o.setName('magik').setDescription('Magik an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply magik filter to')))
                .addSubcommand((o) => o.setName('pixelize').setDescription('Pixelize an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply pixelize filter to')))
                .addSubcommand((o) => o.setName('posterize').setDescription('Posterize an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply posterize filter to')))
                .addSubcommand((o) => o.setName('redple').setDescription('Redple an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply redple filter to')))
                .addSubcommand((o) => o.setName('sepia').setDescription('Sepia an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply sepia filter to')))
                .addSubcommand((o) => o.setName('sharpen').setDescription('Sharpen an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to apply sharpen filter to')))
                .addSubcommand((o) => o.setName('unsharpen').setDescription('Unsharpen an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to unsharpen')))
                .addSubcommand((o) => o.setName('frame').setDescription('Frame an image').addUserOption((u) => u.setName('user').setRequired(false).setDescription('User\'s avatar to frame')))
        });
    }
};
