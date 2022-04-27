const Command = require('../Command.js');

const {oneLine} = require('common-tags');
const emojis = require('../../utils/emojis.json');

const cost = 1000;
module.exports = class resetSmashOrPassCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'resetsmashorpass',
            aliases: ['clearsop', 'resetsop', 'resetsmash', 'clearmatches'],
            usage: 'resetsmashorpass',
            description: oneLine`
        Resets all your smash or pass matches, likes, and passes.
        Start Fresh!
        
        Cost: ${cost} points
      `,
            type: client.types.SMASHORPASS,
        });
    }

    async run(message) {
        const prefix = message.client.db.settings.selectPrefix
            .pluck()
            .get(message.guild.id);
        let points = message.client.db.users.selectPoints
            .pluck()
            .get(message.author.id, message.guild.id);
        if (points < cost) {
            return await message.reply(
                `${emojis.nep} **You need ${cost - points} more points ${
                    emojis.point
                } in this server to reset your ${
                    emojis.smashorpass
                } Smash or Pass ${
                    emojis.smashorpass
                } history.**\n\nTo check your points ${
                    emojis.point
                }, type \`${prefix}points\``
            );
        }
        message
            .reply(
                `Your ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} matches, likes, and passes will be reset and ${cost} points ${emojis.point} will be deducted from you.\nDo you want to continue?`
            )
            .then(async (msg) => {
                const reactions = confirm(msg, message.author, ['✅', '❎'], 30000);

                if (reactions === '✅') {
                    try {
                        message.client.db.SmashOrPass.resetSmashOrPass.run(
                            message.author.id
                        );
                        message.client.db.users.updatePoints.run(
                            {points: -cost},
                            message.author.id,
                            message.guild.id
                        );
                        await msg.edit(
                            `Your ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} history has been reset. Enjoy the fresh start!`
                        );
                    }
                    catch (e) {
                        console.log(e);
                        await msg.edit(
                            `Failed to clear ${emojis.smashorpass} **Smash or Pass** ${emojis.smashorpass} history`
                        );
                    }
                }
            });
    }
};
