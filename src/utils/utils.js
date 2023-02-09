const {EmbedBuilder, Collection} = require('discord.js');
const schedule = require('node-schedule');
const {stripIndent} = require('common-tags');
const emojis = require('./emojis.json');
const request = require('request');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

// statics are shared across all instances of the class
class Statics {
    static #config = null;

    static get config() {
        if (this.#config === null) {

            let configFilename = fs.existsSync(__basedir + '/config.yml') ? '/config.yml' : fs.existsSync(__basedir + '/config.yaml') ? '/config.yaml' : null;
            if (!configFilename) {
                console.warn('Custom config.yml not found. Attempting to use config.default.yml');
                configFilename = fs.existsSync(__basedir + '/config.default.yaml') ? '/config.default.yaml' : fs.existsSync(__basedir + '/config.default.yml') ? '/config.default.yml' : null;
                if (!configFilename) {
                    throw new Error('No config file found. Please create a config.yml or config.default.yml file.');
                }
            }
            console.log(`Using config file ${configFilename}`);

            const configObj = YAML.parse(fs.readFileSync(__basedir + configFilename, 'utf8'));
            if (!configObj) {
                throw new Error('Invalid config file - Make sure it is valid YAML');
            }
            const replace = (obj, path = []) => {
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        replace(value, [...path, key]);
                    } else {
                        const envVar = 'SPLITE_' + [...path, key].join('_').toUpperCase();
                        if (process.env[envVar]) {
                            if (typeof value === 'string') {
                                obj[key] = process.env[envVar];
                                if (obj[key] === 'true') obj[key] = true;
                                else if (obj[key] === 'false') obj[key] = false;
                            } else if (typeof value === 'number') {
                                obj[key] = Number(process.env[envVar]);
                            } else if (typeof value === 'boolean') {
                                obj[key] = process.env[envVar].toLowerCase() === 'true';
                            } else if (Array.isArray(value)) {
                                // trim and split by comma
                                obj[key] = process.env[envVar].trim().split(',').map(v => v.trim());
                            }
                            console.log(`Set ${configFilename} value ${key} to environment variable ${envVar} with value ${obj[key]}`);
                        }
                    }
                }
            };
            replace(configObj);
            this.#config = configObj;
        }
        return this.#config;
    }

    static get configAsEnvirons() {
        const environs = {};
        const replace = (obj, path = []) => {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                    replace(value, [...path, key]);
                } else {
                    if (Array.isArray(value)) {
                        environs['SPLITE_' + [...path, key].join('_').toUpperCase()] = value.join(',');
                    } else {
                        environs['SPLITE_' + [...path, key].join('_').toUpperCase()] = value;
                    }
                }
            }
        };
        replace(this.config);
        return Object.entries(environs).map(([key, value]) => `${key}=${value}`).join('\n');
    }
}

// create database folder
function createDatabaseFolder() {
    const dbPath = path.join(__basedir, 'data/db');
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, {recursive: true});
    }
}

/**
 * Loops through all options of a command, finds subcommands, and if no corresponding subcommand is enabled, removes it from the options
 * @param client    The client
 * @param {Array} options   The command options
 * @param commandMappings   The command mappings - an object with the subcommand name as the key and the corresponding command name as the value
 */
function removeDisabledCommandsFromGroup(client, options, commandMappings = null) {
    for (let i = 0; i < options.length; i++) {
        if (options[i].constructor.name === 'SlashCommandSubcommandBuilder') {
            if (!client.commands.has(commandMappings ? commandMappings[options[i].name] : options[i].name)) {
                options.splice(i, 1);
                i--;
            }
        } else if (options[i].constructor.name === 'SlashCommandSubcommandGroupBuilder') {
            console.log(`Checking subgroup ${options[i].name}`);
            // go through all the subcommands of this subcommandGroup, check if corresponding command exists, and if not, remove it
            for (let j = 0; j < options[i].options.length; j++) {
                console.log(`commandMappings[${options[i].name}][${options[i].options[j].name}] = ${commandMappings[options[i].name][options[i].options[j].name]}`);
                if (options[i].options[j].constructor.name === 'SlashCommandSubcommandBuilder') {
                    const commandName = commandMappings ? commandMappings[options[i].name][options[i].options[j].name] : options[i].options[j].name;
                    if (!client.commands.has(commandName)) {
                        console.log(`Removing ${commandName}`);
                        options[i].options.splice(j, 1);
                        j--;
                    }
                }
            }
            // // if there are no subcommands left, remove the group
            // if (options[i].options.length === 0) {
            //     options.splice(i, 1);
            //     i--;
            // }
        }
    }
}


/**
 * Capitalizes a string
 * @param {string} string
 */
function capitalize(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

/**
 * Removes specifed array element
 * @param {Array} arr
 * @param {*} value
 */
function removeElement(arr, value) {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

/**
 * Trims array down to specified size
 * @param {Array} arr
 * @param {int} maxLen
 */
function trimArray(arr, maxLen = 10) {
    if (arr.length > maxLen) {
        const len = arr.length - maxLen;
        arr = arr.slice(0, maxLen);
        arr.push(`and **${len}** more...`);
    }
    return arr;
}

/**
 * Trims joined array to specified size
 * @param {Array} arr
 * @param {int} maxLen
 * @param {string} joinChar
 */
function trimStringFromArray(arr, maxLen = 2048, joinChar = '\n') {
    let string = arr.join(joinChar);
    const diff = maxLen - 15; // Leave room for "And ___ more..."
    if (string.length > maxLen) {
        string = string.slice(0, string.length - (string.length - diff));
        string = string.slice(0, string.lastIndexOf(joinChar));
        string =
            string + `\nAnd **${arr.length - string.split('\n').length}** more...`;
    }
    return string;
}

/**
 * Gets current array window range
 * @param {Array} arr
 * @param {int} current
 * @param {int} interval
 */
function getRange(arr, current, interval) {
    const max =
        arr.length > current + interval ? current + interval : arr.length;
    current = current + 1;
    return arr.length === 1 || arr.length === current || interval === 1
        ? `[${current}]`
        : `[${current} - ${max}]`;
}

/**
 * Gets the ordinal numeral of a number
 * @param {int} number
 */
function getOrdinalNumeral(number) {
    let numberStr = number.toString();
    if (numberStr === '11' || numberStr === '12' || numberStr === '13')
        return numberStr + 'th';
    if (numberStr.endsWith(1)) return numberStr + 'st';
    else if (numberStr.endsWith(2)) return numberStr + 'nd';
    else if (numberStr.endsWith(3)) return numberStr + 'rd';
    else return numberStr + 'th';
}

/**
 * Gets the next moderation case number
 * @param {Client} client
 * @param {Guild} guild
 * @param modLog
 */
async function getCaseNumber(client, guild, modLog) {
    const message = (await modLog.messages.fetch({limit: 100}))
        .filter(
            (m) =>
                m.member === guild.members.me &&
                m.embeds[0] &&
                m.embeds[0].footer &&
                m.embeds[0].footer.text &&
                m.embeds[0].footer.text.startsWith('Case')
        )
        .first();

    if (message) {
        const footer = message.embeds[0].footer.text;
        const num = parseInt(footer.split('#').pop());
        if (!isNaN(num)) return num + 1;
    }

    return 1;
}

/**
 * Gets current status
 * @param {...*} args
 */
function getStatus(...args) {
    for (const arg of args) {
        if (!arg) return 'disabled';
    }
    return 'enabled';
}

/**
 * Surrounds welcome/farewell message keywords with backticks
 * @param {string} message
 */
function replaceKeywords(message) {
    if (!message) return message;
    else
        return message
            .replace(/\?member/g, '`?member`')
            .replace(/\?username/g, '`?username`')
            .replace(/\?tag/g, '`?tag`')
            .replace(/\?size/g, '`?size`');
}

function getEmojiForJoinVoting(guild, client) {
    const {joinvoting_emoji: joinVotingEmoji} =
        client.db.settings.selectJoinVotingMessage.get(guild.id);
    let emoji = joinVotingEmoji || '`None`';
    if (emoji && !isNaN(joinVotingEmoji)) {
        emoji = guild.emojis.cache.find((e) => e.id === emoji) || null;
    }
    return emoji;
}

/**
 * Surrounds crown message keywords with backticks
 * @param {string} message
 */
function replaceCrownKeywords(message) {
    if (!message) return message;
    else
        return message
            .replace(/\?member/g, '`?member`')
            .replace(/\?username/g, '`?username`')
            .replace(/\?tag/g, '`?tag`')
            .replace(/\?role/g, '`?role`')
            .replace(/\?points/g, '`?points`');
}

/**
 * Transfers crown from one member to another
 * @param {Client} client
 * @param {Guild} guild
 * @param crownRoleId
 */
async function transferCrown(client, guild, crownRoleId) {
    const crownRole = guild.roles.cache.get(crownRoleId);

    // If crown role is unable to be found
    if (!crownRole) {
        return client.sendSystemErrorMessage(
            guild,
            'crown update',
            stripIndent`
      Unable to transfer crown role, it may have been modified or deleted
    `
        );
    }

    const leaderboard = client.db.users.selectLeaderboard.all(guild.id);
    const winner = await guild.members.fetch(leaderboard[0].user_id);
    const points = client.db.users.selectPoints.pluck().get(winner.id, guild.id);
    let quit = false;

    await Promise.all(
        (await guild.members.fetch()).map(async (member) => {
            // Good alternative to handling async forEach
            if (member.roles.cache.has(crownRole.id)) {
                try {
                    await member.roles.remove(crownRole);
                } catch (err) {
                    quit = true;
                    // Clear points
                    client.db.users.wipeAllPoints.run(guild.id);

                    return client.sendSystemErrorMessage(
                        guild,
                        'crown update',
                        stripIndent`
          Unable to transfer crown role, please check the role hierarchy and ensure I have the Manage Roles permission
        `,
                        err.message
                    );
                }
            }
        })
    );

    // Clear points
    client.db.users.wipeAllPoints.run(guild.id);

    if (quit) return;

    // Give role to winner
    try {
        await winner.roles.add(crownRole);
    } catch (err) {
        return client.sendSystemErrorMessage(
            guild,
            'crown update',
            stripIndent`
      Unable to transfer crown role, please check the role hierarchy and ensure I have the Manage Roles permission
    `,
            err.message
        );
    }

    // Get crown channel and crown channel
    let {crown_channel_id: crownChannelId, crown_message: crownMessage} =
        client.db.settings.selectCrown.get(guild.id);
    const crownChannel = guild.channels.cache.get(crownChannelId);

    // Send crown message
    if (
        crownChannel &&
        crownChannel.viewable &&
        crownChannel
            .permissionsFor(guild.members.me)
            .has(['SendMessages', 'EmbedLinks']) &&
        crownMessage
    ) {
        crownMessage = crownMessage
            .replace(/`?\?member`?/g, winner) // Member mention substitution
            .replace(/`?\?username`?/g, winner.user.username) // Username substitution
            .replace(/`?\?tag`?/g, winner.user.tag) // Tag substitution
            .replace(/`?\?role`?/g, crownRole) // Role substitution
            .replace(/`?\?points`?/g, points); // Points substitution
        crownChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(crownMessage)
                    .setFooter({text: 'Upcoming Crown Transfer --> '})
                    .setTimestamp(new Date(guild.job.nextInvocation()))
                    .setColor(guild.members.me.displayHexColor),
            ],
        });
    }

    client.logger.info(
        `${guild.name}: Assigned crown role to ${winner.user.tag} and reset server points`
    );
}

/**
 * Schedule crown role rotation if checks pass
 * @param {Client} client
 * @param {Guild} guild
 */
function scheduleCrown(client, guild) {
    const {crown_role_id: crownRoleId, crown_schedule: cron} =
        client.db.settings.selectCrown.get(guild.id);

    if (crownRoleId && cron) {
        guild.job = schedule.scheduleJob(cron, async () => {
            await client.utils.transferCrown(client, guild, crownRoleId);
        });

        client.logger.info(`${guild.name}: Successfully scheduled job`);
    } else {
        console.error(`${guild.name}: Failed to schedule job`);
    }
}

function createCollections(client, guild) {
    guild.snipes = new Collection();
    guild.editSnipes = new Collection();
    guild.JoinVotingInProgress = new Collection();
    guild.ships = new Collection();
    guild.shippingOdds = new Collection();
}

function createProgressBar(percentage) {
    if (percentage > 100) percentage = 100;
    if (percentage < 5) percentage = 5;
    let progressBar = '';
    const fives = Math.floor(percentage / 5);
    //Empty
    if (fives === 0) {
        progressBar += emojis.EmptyBegin;
        let i = 0;
        while (i < 8) {
            (progressBar += emojis.EmptyMid);
            i++;
        }
        progressBar += emojis.EmptyEnd;
    } else {
        if (fives > 1) {
            let tens = Math.floor(fives / 2);
            let endWithHalfMid = fives % 2;

            for (let i = 0; i < tens; i++) {
                if (i === 0) progressBar += emojis.FillBegin;
                else if (i === 9) progressBar += emojis.FillEnd;
                else progressBar += emojis.FillMid;
            }

            const empties = 10 - tens;
            if (empties > 0) {
                if (empties === 1 && endWithHalfMid)
                    progressBar += emojis.HalfEnd; //90+
                else {
                    if (endWithHalfMid) progressBar += emojis.HalfMid;
                    for (let i = 0; i < empties - endWithHalfMid; i++) {
                        if (i === empties - endWithHalfMid - 1)
                            progressBar += emojis.EmptyEnd;
                        else progressBar += emojis.EmptyMid;
                    }
                }
            }
        } else {
            progressBar += emojis.HalfBegin;
            let i = 0;
            while (i < 8) {
                (progressBar += emojis.EmptyMid);
                i++;
            }
            progressBar += emojis.EmptyEnd;
        }
    }
    return progressBar;
}

// is message empty? Check if the message is a webhook, or has no content, or has no attachments
function isEmptyMessage(message) {
    return message?.webhookId && !message?.content && message?.embeds?.length === 0 && message?.attachments?.length === 0;
}

/**
 * Returns a random number between min and max, excluding the numbers in the exclude array
 * @param min
 * @param max
 * @param exclude
 * @return {number}
 */
function getRandomInt(min, max, exclude = []) {
    const num = parseInt((Math.random() * (max - min + 1)) + min);
    if (exclude.includes(num)) return getRandomInt(min, max, exclude);
    else return num;
}

/**
 * Returns a random item based on the weight of the items
 * @param input an object with key:weight fields
 * @return {*}
 */
function weightedRandom(input) {
    const total = Object.keys(input).reduce((a, b) => a + input[b], 0);
    const rand = Math.random() * total;
    let current = 0;
    for (const key in input) {
        current += input[key];
        if (current > rand) return key;
    }
}

/**
 * Returns a generated meme url from imgflip
 * @param client
 * @param {Number} templateID
 * @param {String} text0
 * @param {String} text1
 * @param {string} [color = ''] color
 * @param {string} [outlineColor = ''] outlineColor
 */
function generateImgFlipImage(
    client,
    templateID,
    text0,
    text1,
    color = '',
    outlineColor = ''
) {
    return new Promise((resolve, reject) => {
        let options = {
            method: 'POST',
            url: 'https://api.imgflip.com/caption_image',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
            },
            formData: {
                template_id: `${templateID}`,
                username: client.config.apiKeys.imgflip.username,
                password: client.config.apiKeys.imgflip.password,
                'boxes[0][text]': text0,
                'boxes[1][text]': text1,
                'boxes[0][color]': color,
                'boxes[1][color]': color,
                'boxes[0][outline_color]': outlineColor,
                'boxes[1][outline_color]': outlineColor,
            },
        };
        request(options, function (error, response) {
            const res = JSON.parse(response.body);

            if (res.success === true && res.data.url) {
                resolve(res.data.url || error);
            } else reject(res.error_message);
        });
    });
}

function checkTopGGVote(client, userId) {
    if (client.config?.apiKeys?.topGG?.useMode === 'api_mode') {
        //If cache has 5 minute old version, send that
        if (client.votes.has(userId)) {
            let diff =
                Math.abs(new Date() - client.votes.get(userId).time) / 1000 / 60;
            if (diff <= 5)
                return new Promise((resolve) => {
                    resolve(client.votes.get(userId).voted);
                });
        }
        //otherwise return check topgg api
        return getTopGGVoteFromAPI(client, userId);
    }
    // If using webhook mode, check database for vote
    else if (client?.config?.apiKeys?.topGG?.useMode === 'webhook_mode') {
        return new Promise((resolve) => {
            const votes = client.db.integrations.selectRow.get(userId);
            if (votes && votes.topgg) {
                resolve(votes.topgg && Date.now() - votes.topgg < 43200000);
            } else {
                resolve(false);
            }
        });
    }
}

function getTopGGVoteFromAPI(client, userId) {
    return new Promise((resolve) => {
        let options = {
            method: 'GET',
            url: `https://top.gg/api/bots/${client.user.id}/check?userId=${userId}`,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
                Authorization: client.config?.apiKeys?.topGG?.api_mode?.token,
            },
        };
        request(options, function (error, response) {
            try {
                const res = JSON.parse(response.body);
                if (res) {
                    client.votes.set(userId, {time: new Date(), voted: res.voted});
                    resolve(res.voted);
                } else {
                    client.votes.set(userId, {time: new Date(), voted: 0});
                    resolve(0);
                }
            } catch (e) {
                client.votes.set(userId, {time: new Date(), voted: 0});
                resolve(0);
            }
        });
    });
}

/**
 * Alternates the characters between upper and lower case
 * @param {string} str
 */
function spongebobText(str) {
    let newStr = '';
    str.split('').forEach((el, idx) => {
        newStr += idx % 2 === 0 ? el.toLowerCase() : el.toUpperCase();
    });
    return newStr;
}

/**
 * Replaces all mentions in a message with display names
 * @param {string} content
 * @param {object} guild
 */
async function replaceMentionsWithNames(content, guild) {
    const mentionsInMsg = content.match(/<(@!?\d+)>/g);

    if (mentionsInMsg) {
        for (let i = 0; i < mentionsInMsg.length; i++) {
            const id = mentionsInMsg[i]
                .replace('<@', '')
                .replace('!', '')
                .replace('&', '')
                .replace('>', '');
            const mem = await guild.members.fetch(id);

            content = content.replace(mentionsInMsg[i], mem.displayName);
        }
    }
    return content;
}

function isCommandOrBotMessage(msg, prefix) {
    const cmd = msg?.content?.trim()
        ?.split(/ +/g)
        ?.shift()
        ?.slice(prefix.length)
        ?.toLowerCase();
    const command =
        msg?.client?.commands?.get(cmd) || msg?.client?.aliases?.get(cmd);
    if (msg?.author?.bot || command) return true;
}

module.exports = {
    Statics,
    createDatabaseFolder,
    removeDisabledCommandsFromGroup,
    capitalize,
    removeElement,
    trimArray,
    trimStringFromArray,
    getRange,
    getOrdinalNumeral,
    getCaseNumber,
    getStatus,
    replaceKeywords,
    replaceCrownKeywords,
    transferCrown,
    scheduleCrown,
    getEmojiForJoinVoting,
    createCollections,
    createProgressBar,
    getRandomInt,
    weightedRandom,
    generateImgFlipImage,
    spongebobText,
    replaceMentionsWithNames,
    checkTopGGVote,
    isEmptyMessage,
    isCommandOrBotMessage
};
