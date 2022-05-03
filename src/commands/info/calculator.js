const Command = require("../Command.js");
const { Calculator } = require("weky");

module.exports = class CalculatorCommand extends Command {
   constructor(client) {
      super(client, {
         name: "calculator",
         aliases: ["calc"],
         usage: "calculator",
         description: "An advance calculator with buttons to do some maths",
         type: client.types.INFO,
      });
   }

   async run(message) {
      await Calculator({
         message: message,
         embed: {
            title: "Calculator",
            color: "#5865F2",
            footer: message.member.displayName,
            timestamp: true,
         },
         disabledQuery: "Calculator is disabled!",
         invalidQuery: "The provided equation is invalid!",
         othersMessage: "Only <@{{author}}> can use the buttons!",
      });
   }
};
