const Koa = require('koa');
const KoaBody = require('koa-body');
const config = require('../config.json');
const AsciiTable = require('ascii-table');
const {readdirSync} = require('fs');
const {resolve, join} = require('path');

module.exports = class Webserver {
    constructor(client) {
        this.logger = require('./utils/logger.js');
        this.logger.info('Initializing Webserver...');
        this.app = new Koa();
        this.app.use(KoaBody({multipart: true}));
        this.config = config;
        this.root = '/';
        this.endpoints = {};
        this.db = require('./utils/db.js');
        this.client = client;

        this.app.use((ctx) => {
            if (ctx.path === this.root) {
                ctx.type = 'application/json';

                if (this.config.webserver.debug) {
                    this.logger.debug(`[WEBSERVER] ${ctx.ip} requested ${ctx.path}`);
                }
                ctx.body = {
                    status: client?.ws?.ping ? 'online' : 'offline',
                    uptime: client?.ws?.uptime,
                    endpoints: Object.keys(this.endpoints).map(key => {
                        return {
                            url: key,
                            description: this.endpoints[key].description,
                        };
                    })
                };
                ctx.status = 200;
                return;
            }

            const endpoint = this.endpoints[ctx.path];
            if (endpoint) {
                endpoint.handle(ctx);
            }
            else {
                ctx.status = 404;
                ctx.body = '404 Not Found';
            }
        });

        this.app.listen(this.config.webserver.port, () => {
            this.loadEndpoints('./endpoints', this.root);
            console.log(`Webserver is running on port ${this.config.webserver.port}`);
        });
    }

    loadEndpoints(directory, ROOT) {
        this.logger.info('Loading endpoints...');
        let table = new AsciiTable('ENDPOINTS');
        table.setHeading('Endpoint', 'Description', 'Status');

        const dirPath = resolve(__dirname, directory);
        readdirSync(dirPath).filter(file => !file.endsWith('.js')).forEach(dir => {
            const files = readdirSync(resolve(__basedir, join(dirPath, dir))).filter(file => file.endsWith('js'));

            files.reverse().forEach(file => {
                //extract the file name
                const filename = file.split('.')[0].replace(/\//g, '-');
                const name = `${ROOT}${dir}${filename === 'index' ? '' : `/${filename}`}`;

                if (this.endpoints[name]) {
                    this.logger.error(`${name} endpoint already exists`);
                    return table.addRow(name, '', 'fail');
                }

                //load the endpoint
                const Endpoint = require(join(dirPath, dir, file));
                const endpoint = new Endpoint(this);

                if (!endpoint.disabled) {
                    this.endpoints[name] = endpoint;
                    table.addRow(name, endpoint.description, 'pass');
                }
                else {
                    table.addRow(name, endpoint.description, 'fail');
                }
            });

            this.logger.info(`\n${table.toString()}`);
        });
    }
};
