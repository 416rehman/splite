const Endpoint = require('../Endpoint');

module.exports = class CommandsWebhook extends Endpoint {
    constructor(webserver) {
        super(webserver, {
            description: 'Displays all the working commands. Query params: `stringify` (default: false)',
            rateLimit: {
                rpm: 30,
                cooldown: 60000
            },
            disabled: false
        });
    }

    get(req) {

        let commands = this.webserver.client.commands.filter(c => !c.disabled);

        const categories = commands.map(c => c.type).filter((v, i, a) => a.indexOf(v) === i).sort();

        const allCommands = {};

        categories.forEach(category => {
            console.log(category);
            const cmds = commands.filter(c => c.type === category && (category == 'admin' ? !c.name.startsWith('clear') : true));
            if (req.query.stringify) {
                allCommands[category + `(${cmds.size})`] = cmds.map(c => `\`${c.name}\``).join(', ');
            }
            else {
                allCommands[category] = cmds.map(c => {
                    return {
                        name: c.name,
                        description: c.description,
                        usage: c.usage,
                        aliases: c.aliases,
                        example: c.example,
                    };
                });
            }
        });


        return {
            status: 200,
            body: {
                message: `Serving ${commands.size} commands across ${categories.length} categories`,
                commands: allCommands
            }
        };
    }
};
