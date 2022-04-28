module.exports = class Endpoint {
    constructor(client, options) {
        // Validate all options passed
        this.constructor.validateOptions(client, options);

        this.client = client;
        this.description = options.description;
        this.allowedHosts = options.allowedHosts;
        this.allowedIPs = options.allowedIPs;
        this.authorization = options.authorization;
        this.rateLimit = {
            rpm: options.rateLimit?.rpm || 0,                            // How many requests per minute are allowed per IP
            cooldown: options.rateLimit?.cooldown || 5000,               // How many milliseconds to ignore requests after hitting the rate limit. Minimum is 1000ms.
            store: {},                                                  // The store to use for the rate limiter
        };
        this.disabled = options.disabled;                               // Whether or not the webhook is disabled
        this.method = options.method || 'POST';                         // Supported Methods: 'GET', 'POST'. Default: 'POST'
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
     * Validates the host of the request.
     * @param host
     * @return {boolean}
     */
    checkHost(host) {
        if (this.allowedHosts) {
            return !!this.allowedHosts.includes(host);
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
            return {
                status: 429,
                body: 'Rate limit exceeded. Please try again later. (Cooldown: ' + this.rateLimitCooldown + 'ms)'
            };
        }

        if (!this.checkAuthorization(request.headers.authorization)) {
            return {
                status: 401, body: 'Unauthorized. Invalid authorization header.'
            };
        }

        if (!this.checkHost(request.headers.host)) {
            return {
                status: 403, body: 'Forbidden. You are not allowed to access this endpoint.'
            };
        }

        if (!this.checkIP(request.ip)) {
            return {
                status: 403, body: 'Forbidden. You are not allowed to access this endpoint.',
            };
        }
    }

    /**
     * Runs the webhook logic - OVERRIDE THIS METHOD
     * @param body
     * @return {Promise<void>}
     */
    execute(req, res) {
        return {
            status: 200, body: `NOT OVERRIDDEN. req: ${req} res: ${res}`
        };
    }

    handle(req, res) {
        const ret = this.execute(req);

        res.writeHead(ret.status || 200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(ret.body || {message: 'No body'}));
    }

    static validateOptions(client, options) {
        if (!client) throw new Error('No client was found');
        if (typeof options !== 'object')
            throw new TypeError('Command options is not an Object');

        if (options.description) {
            // description
            if (typeof options.description !== 'string')
                throw new TypeError('description is not a string');
            if (options.name > 100)
                throw new Error('Description is too long. Max 100 characters');
        }

        if (options.allowedHosts) {
            // allowedHosts
            if (!Array.isArray(options.allowedHosts))
                throw new TypeError('allowedHosts is not an Array. To allow all hosts, remove this property.');
            for (let i = 0; i < options.allowedHosts.length; i++) {
                if (typeof options.allowedHosts[i] !== 'string')
                    throw new TypeError('allowedHosts is not an Array of strings');
            }
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

        if (options.method) {
            // method
            if (typeof options.method !== 'string')
                throw new TypeError('method is not a string. To use default method of POST, remove this property.');
            if (options.method.toLowerCase() !== 'post' && options.method.toLowerCase() !== 'get')
                throw new Error('method is not a valid method. Must be either "post" or "get"');
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
