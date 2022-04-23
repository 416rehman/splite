const Command = require('../../Command.js');
const {MessageButton} = require("discord.js");
const {MessageActionRow} = require("discord.js");
const {MessageEmbed} = require('discord.js');
const {oneLine} = require('common-tags');

module.exports = class toggleSmashOrPassCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'optout',
            aliases: ['tsmashorpass', 'tsmash', 'tsop', 'togglesmash', 'optoutsmash', 'optin'],
            usage: 'togglesmashorpass',
            description: oneLine`
        Opt out/in of 🔥 Smash or Pass 👎. If you opt-out you will not be shown to other users in the game.
      `,
            type: client.types.SMASHORPASS,
            examples: ['togglesmashorpass'],
            exclusive: true
        });
    }

    async run(message, args) {
        const currentStatus = message.client.db.users.selectOptOutSmashOrPass.pluck().get(message.author.id)

        if (currentStatus === 0) {
            const embed = new MessageEmbed()
                .setTitle(`Opt out of 🔥 Smash or Pass 👎`)
                .setDescription(`You are currently opted in 🔥 Smash or Pass 👎\nIf you opt out, you will not be shown in the game.\n**Do you wish to opt out?**`)

            const row = new MessageActionRow()
            row.addComponents(new MessageButton().setCustomId(`proceed`).setLabel(`✅ Proceed`).setStyle('SUCCESS'))
            row.addComponents(new MessageButton().setCustomId(`cancel`).setLabel(`❌ Cancel`).setStyle('DANGER'))

            message.channel.send({embeds: [embed], components: [row]}).then(async msg => {

                const filter = (button) => button.user.id === message.author.id;
                const collector = msg.createMessageComponentCollector({
                    filter,
                    componentType: 'BUTTON',
                    time: 15000,
                    dispose: true
                });

                let updated = false;
                collector.on('collect', async b => {
                    this.done(message.author.id)
                    updated = true;
                    if (b.customId === 'proceed') {
                        await msg.client.db.users.updateOptOutSmashOrPass.run(1, message.author.id)
                        msg.edit({
                            embeds: [new MessageEmbed()
                                .setTitle(`Opt out of 🔥 Smash or Pass 👎`)
                                .setDescription(`**You have opted out of 🔥 Smash or Pass 👎**\nYou will not be shown in the game.`)
                                .setFooter({text: `To opt back in, use this command again`})], components: []
                        })
                    } else {
                        this.done(message.author.id)
                        msg.edit({
                            components: [], embeds: [new MessageEmbed().setTitle('Opt-Out Smash Or Pass')
                                .setDescription(`${message.member} Did Not Opt-Out - **Cancelled**`)]
                        });
                    }
                })

                collector.on('end', () => {
                    this.done(message.author.id)
                    if (updated) return;
                    msg.edit({
                        components: [], embeds: [new MessageEmbed().setTitle('Opt-Out Smash Or Pass')
                            .setDescription(`${message.member} Did Not Opt-Out  - **Expired**`)]
                    });
                });
            })
        } else if (currentStatus === 1) {
            const embed = new MessageEmbed()
                .setTitle(`Opt in to 🔥 Smash or Pass 👎`)
                .setDescription(`You are currently opted out of 🔥 Smash or Pass 👎\nIf you opt in, you will be shown in the game.\n**Do you wish to opt in?**`)

            const row = new MessageActionRow()
            row.addComponents(new MessageButton().setCustomId(`proceed`).setLabel(`✅ Proceed`).setStyle('SUCCESS'))
            row.addComponents(new MessageButton().setCustomId(`cancel`).setLabel(`❌ Cancel`).setStyle('DANGER'))

            message.channel.send({embeds: [embed], components: [row]}).then(async msg => {
                const filter = (button) => button.user.id === message.author.id;
                const collector = msg.createMessageComponentCollector({
                    filter,
                    componentType: 'BUTTON',
                    time: 15000,
                    dispose: true
                });

                let updated = false;
                collector.on('collect', async b => {
                    this.done(message.author.id)
                    updated = true;
                    if (b.customId === 'proceed') {
                        await msg.client.db.users.updateOptOutSmashOrPass.run(0, message.author.id)
                        msg.edit({
                            embeds: [new MessageEmbed()
                                .setTitle(`Opt In to 🔥 Smash or Pass 👎`)
                                .setDescription(`**You have opted in to 🔥 Smash or Pass 👎**\nYou will now be shown in the game.`)
                                .setFooter({text: `To opt back out, use this command again`})], components: []
                        })
                    } else {
                        this.done(message.author.id)
                        msg.edit({
                            components: [], embeds: [new MessageEmbed().setTitle('Opt-In Smash Or Pass')
                                .setDescription(`${message.member} Did Not Opt-In - **Cancelled**`)]
                        });
                    }
                })

                collector.on('end', () => {
                    this.done(message.author.id)
                    if (updated) return;
                    msg.edit({
                        components: [], embeds: [new MessageEmbed().setTitle('Opt-In Smash Or Pass')
                            .setDescription(`${message.member} Did Not Opt-In  - **Expired**`)]
                    });
                });
            })
        }
    }
};
