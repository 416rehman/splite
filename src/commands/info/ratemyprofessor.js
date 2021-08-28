const Command = require('../Command.js');
const rmp = require('../../utils/ratemyprofessor')
const { MessageEmbed } = require('discord.js');
const emojis = require('../../utils/emojis.json')
const { EmbedReactionMenu } = require('../ReactionMenu.js');

function generateRMPembed(prof, profQuery, schoolQuery, school) {
    return new MessageEmbed()
        .setTitle(`${prof.firstName} ${prof.lastName} | ${prof.department} `, '', `https://www.ratemyprofessors.com/campusRatings.jsp?sid=${prof.school.legacyId}`)
        .setAuthor(`${prof.school.name}`)
        .setDescription(`**${prof.avgRating}/5** Average - Based On ${prof.numRatings} ratings\n**${prof.wouldTakeAgainPercent > 0 ? `${prof.wouldTakeAgainPercent.toFixed()}%` : 'N/A'}** Would Take Again\n${prof.mostUsefulRating ? `😎 Most Helpful Rating - ${prof.mostUsefulRating.class}\`\`\`${prof.mostUsefulRating.comment}\`\`\`` : ''}`)
        .setURL(`https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${prof.legacyId}`)
        .addField(`Avg Rating`, `${prof.avgRating}`, true)
        .addField(`Avg Difficulty`, `${prof.avgDifficulty}`, true)
        .addField(`# Of Ratings`, `${prof.numRatings}`, true)
        .setThumbnail(`https://i.imgur.com/7qt9vAg.png`)
        .setFooter(`Search Query: "${profQuery}" ${schoolQuery ? `| School Filter: ${school.length ? `${school[0].node.name}` : 'No schools found with provided name'}` : 'To search specific schools "<profName> : <school>"'}`)

        .setColor("RANDOM");
}

module.exports = class RateMyProfessor extends Command {
    constructor(client) {
        super(client, {
            name: 'ratemyprofessor',
            aliases: ['rmp', 'rate', 'prof', 'professor', 'ratemyprof'],
            usage: 'rmp <professor name> : <optional college name>',
            description: 'Retrieves information from ratemyprofessor.com for a professor',
            type: client.types.INFO,
            examples: ['rmp fardad', 'rate hong']
        });
    }
    async run(message, args) {
        let profQuery, schoolQuery, school
        args = args.join(' ').split(':')
        profQuery = args[0]

        if (args.length > 1) {
            schoolQuery = args[1];
            schoolQuery = schoolQuery.trim()
            profQuery = profQuery.trim()
            if (schoolQuery == 'seneca') schoolQuery = 'seneca all'
            try {
                school = await rmp.searchSchool(schoolQuery)
                school = (JSON.parse(school)).data.newSearch.schools.edges
            } catch (e) {
                console.log(e)
            }
        }
        const schoolFilter = school && school.length ? school[0].node.id : ''
        rmp.searchProfessors(profQuery, schoolFilter).then(async result=> {

            const noneFound = new MessageEmbed()
                .setTitle(`Rate My Professor`)
                .setDescription(`${emojis.fail} No Professors Found`)
                .setThumbnail(`https://i.imgur.com/7qt9vAg.png`)
                .setFooter(`Search Query: "${profQuery}" ${schoolQuery ? `| School Filter: ${schoolFilter.length > 0 ? `${school[0].node.name}` : 'No schools found with provided name'}`: ''}`)
                .setColor("RED");

            let profs
            try { profs = (JSON.parse(result)).data.newSearch.teachers.edges }
            catch (e) {
                console.log(e)
                return message.channel.send(noneFound);
            }
            if (profs.length > 10) profs.length = 10;

            profs = await Promise.all(profs.map(async (p) => {
                let result = await rmp.retrieveProfessor(p.node.id)
                result = JSON.parse(result)
                return  {...p, ...result.data.node}
            }))

            if (profs.length === 1){
                message.channel.send(generateRMPembed(profs[0], profQuery, schoolQuery, school, message))
            }
            else if (profs.length > 1) {
                const profEmbeds = profs.map(p => {
                    return generateRMPembed(p, profQuery, schoolQuery, school, message)
                })
                new EmbedReactionMenu(message.client, message.channel, message.member, profEmbeds)
            }
            else {
                message.channel.send(noneFound)
            }
        })

    }
};
