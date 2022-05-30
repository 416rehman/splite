module.exports = class Endpoint {
    constructor(webserver, options) {
        // Validate all options passed
        this.constructor.validateOptions(webserver, options);
        this.webserver = webserver;

        this.description = options.description;
        this.allowedIPs = options.allowedIPs;
        this.authorization = options.authorization;
        this.rateLimit = {
            rpm: options.rateLimit?.rpm || 30,                            // How many requests per minute are allowed per IP, default 30. 0 = No rate limit
            cooldown: options.rateLimit?.cooldown || 60000,              // How many milliseconds to ignore requests after hitting the rate limit. Default 60000 (1 minute)
            store: {},                                                   // The store to use for the rate limiter
        };
        this.disabled = options.disabled;                               // Whether or not the webhook is disabled
    }

    /**
     * Checks if the calling IP is rate limited
     * @return {boolean}
     */
    checkRateLimit(ip) {
        if (this.rateLimit.rpm === 0) return false;
        if (this.rateLimit.store[ip] === undefined) this.rateLimit.store[ip] = {
            requests: 0,
            lastRequest: Date.now()
        };
        if (this.rateLimit.store[ip].requests >= this.rateLimit) {
            if (Date.now() - this.rateLimit.store[ip].lastRequest < this.rateLimit.cooldown) return true;
            this.rateLimit.store[ip].requests = 0;
            this.rateLimit.store[ip].lastRequest = Date.now();
        }
        this.rateLimit.store[ip].requests++;
        return false;
    }

    /**
     * Validates the authorization of the request.
     * @param authorization
     * @return {boolean}
     */
    checkAuthorization(authorization) {
        if (this.authorization) {
            return this.authorization === authorization;
        }
        else {
            return true;
        }
    }


    /**
     * Validates the IP of the request.
     * @param ip
     * @return {boolean}
     */
    checkIP(ip) {
        if (this.allowedIPs) {
            return !!this.allowedIPs.includes(ip);
        }
        else {
            return true;
        }
    }

    validate(request) {
        if (this.checkRateLimit(request.ip)) {
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] ${request.ip} is rate limited.`);
            return {
                status: 429,
                body: 'Rate limit exceeded. Please try again later. (Cooldown: ' + this.rateLimit.cooldown + 'ms)'
            };
        }

        if (!this.checkAuthorization(request.headers.authorization)) {
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] ${request.ip} is unauthorized. Invalid authorization header.`);
            return {
                status: 401, body: 'Unauthorized. Invalid authorization header.'
            };
        }

        if (!this.checkIP(request.ip)) {
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] ${request.ip} is unauthorized. IP not allowed.`);
            return {
                status: 403, body: 'Forbidden. You are not allowed to access this endpoint.',
            };
        }
    }


    // eslint-disable-next-line no-unused-vars
    get(req, res) {
        if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] ${req.ip} requested ${req.url}. NOT IMPLEMENTED`);
        return {
            status: 405, body: 'Method not allowed.'
        };
    }

    // eslint-disable-next-line no-unused-vars
    post(req, res) {
        if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] ${req.ip} requested ${req.url}. NOT IMPLEMENTED`);
        return {
            status: 405, body: 'Method not allowed.'
        };
    }

    handle(ctx) {
        const validationError = this.validate(ctx.request);
        if (validationError) {
            ctx.status = validationError.status;
            ctx.body = validationError.body;
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] (${ctx.request.method})${ctx.request.ip} requested ${ctx.request.url}. ${validationError.body}`);

            return;
        }

        if (ctx.request.method === 'GET') {
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] (${ctx.request.method})${ctx.request.ip} requested ${ctx.request.url}.`);

            const data = this.get(ctx.request, ctx.response);
            if (data) {
                if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] (${ctx.request.method})Response from ${ctx.request.url} to ${ctx.request.ip}: [${data.status}] ${data.body}`);
                ctx.response.status = data.status || 200;
                ctx.response.body = {
                    endpoint: {
                        description: this.description,
                        method: 'GET'
                    },
                    ...data.body
                };
            }
        }
        else if (ctx.request.method === 'POST') {
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] (${ctx.request.method})${ctx.request.ip} requested ${ctx.request.url}.`);

            const data = this.post(ctx.request, ctx.response);
            if (data) {
                if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] (${ctx.request.method})Response from ${ctx.request.url} to ${ctx.request.ip}: [${data.status}] ${data.body}`);
                ctx.response.status = data.status || 200;
                ctx.response.body = data.body || {};
            }
        }
        else {
            if (this.webserver.config.webserver.debug) console.log(`[WEBSERVER] (${ctx.request.method})${ctx.request.ip} requested ${ctx.request.url}. Method not supported.`);
            return {
                status: 405, body: 'Method not allowed.'
            };
        }
    }

    static validateOptions(webserver, options) {
        if (!webserver) throw new Error('No webserver was found');
        if (typeof options !== 'object')
            throw new TypeError('Command options is not an Object');

        if (options.description) {
            // description
            if (typeof options.description !== 'string')
                throw new TypeError('description is not a string');
            if (options.name > 100)
                throw new Error('Description is too long. Max 100 characters');
        }

        if (options.allowedIPs) {
            // allowedIPs
            if (!Array.isArray(options.allowedIPs))
                throw new TypeError('allowedIPs is not an Array. To allow all IPs, remove this property.');
            for (let i = 0; i < options.allowedIPs.length; i++) {
                if (typeof options.allowedIPs[i] !== 'string')
                    throw new TypeError('allowedIPs is not an Array of strings');
            }
        }

        if (options.ratelimit) {
            if (options.ratelimit.rpm) {
                // ratelimit.rpm
                if (typeof options.ratelimit.rpm !== 'number')
                    throw new TypeError('ratelimit.rpm is not a number. To disable rate limiting, remove this property.');
                if (options.ratelimit.rpm < 1)
                    throw new Error('ratelimit.rpm is too low. Must be at least 1. Do disable the endpoint, set the "disabled" property to true.');
            }
            if (options.ratelimit.cooldown) {
                // ratelimit.cooldown
                if (typeof options.ratelimit.cooldown !== 'number')
                    throw new TypeError('ratelimit.cooldown is not a number. To disable rate limiting, remove this property.');
                if (options.ratelimit.cooldown < 100)
                    throw new Error('ratelimit.cooldown is too low. Must be at least 100 milliseconds');
            }
        }

    }
};
