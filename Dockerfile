FROM node:16
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
RUN npm rebuild
COPY . .
CMD [ "sh", "-c", "npm run register && npm run start" ]
