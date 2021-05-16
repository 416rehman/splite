const Command = require('../Command.js');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class findStatusCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'findstatus',
      usage: 'findstatus <optional role> <text>',
      description: oneLine`
        Finds users whose status contains the provided text. If a role is provided, the search will be limited to members of that role.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['findstatus #general cool status']
    });
  }
  async run(message, args) {
    let role = this.getRoleFromMention(message, args[0]) ||
        await message.guild.roles.cache.get(args[0]) || null
    if (role) {
      args.shift();
      role = role.members
    }
    else role = message.guild.members.cache

    const query = message.content.slice(message.content.indexOf(args[0]), message.content.length);
    const results = []
    role.forEach(m => {
      for (const activity of m.presence.activities.values()) {
        if(activity.type === 'CUSTOM_STATUS' && activity.state.includes(query))
        {
          results.push({userID: m.id, status: activity.state})
          break;
        }
      }
    })
    console.log(results)
  } 
};