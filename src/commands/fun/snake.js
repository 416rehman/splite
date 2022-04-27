const Command = require("../Command.js");
const { Snake } = require("weky");

module.exports = class SnakeCommand extends Command {
   constructor(client) {
      super(client, {
         name: "snake",
         usage: "snake",
         description:
            "A snake game which is you grow by eating apples until you make a mistake and die.",
         type: client.types.FUN,
      });
   }

   async run(message, args) {
      await Snake({
         message: message,
         embed: {
            title: "Snake Game",
            description: "GG, you scored **{{score}}** points!",
            color: "GREEN",
            footer: message.member.displayName,
            timestamp: true,
         },
         emojis: {
            empty: "⬛",
            snakeBody: "🐍",
            food: "🍎",
            up: "⬆️",
            right: "⬅️",
            down: "⬇️",
            left: "➡️",
         },
         othersMessage: "Only <@{{author}}> can control the snake.",
         buttonText: "Cancel",
      });
   }
};
