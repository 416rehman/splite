module.exports = class Webhook {
    constructor(client, options) {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.allowedHosts = options.allowedHosts;
        this.allowedIPs = options.allowFromIP;
        this.authorization = options.authorization;
        this.requestsPerMinute = options.requestsPerMinute;
        this.cooldownTime = options.cooldownTime;
        this.disabled = options.disabled;

        this.requestTimes = [];
    }

    /**
     * Goes through all the times of the requests, and checks if requestsPerMinute is exceeded.
     * @return {boolean}
     */
    checkCooldown() {
        if (!this.requestsPerMinute || this.requestsPerMinute === 0) return false;

        const now = Date.now();
        const cooldown = this.cooldownTime * 1000;

        for (let i = 0; i < this.requestTimes.length; i++) {
            if (now - this.requestTimes[i] > cooldown) {
                this.requestTimes.splice(i, 1);
                i--;
            }
        }

        if (this.requestTimes.length >= this.requestsPerMinute) return true;

        this.requestTimes.push(now);
        return false;
    }

    /**
     * Validates the authorization of the request.
     * @param authorization
     * @return {boolean}
     */
    checkAuthorization(authorization) {
        if (this.authorization) {
            if (this.authorization === authorization) {
                return true;
            }
            else {
                return false;
            }
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
            if (this.allowedHosts.includes(host)) {
                return true;
            }
            else {
                return false;
            }
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
            if (this.allowedIPs.includes(ip)) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    }

    async validate(request) {
        if (this.checkCooldown()) {
            return {
                status: 429, body: 'Too many requests',
            };
        }

        if (!this.checkAuthorization(request.headers.authorization)) {
            return {
                status: 401, body: 'Unauthorized',
            };
        }

        if (!this.checkHost(request.headers.host)) {
            return {
                status: 403, body: 'Forbidden',
            };
        }

        if (!this.checkIP(request.ip)) {
            return {
                status: 403, body: 'Forbidden',
            };
        }
    }

    /**
     * Runs the webhook logic - OVERRIDE THIS METHOD
     * @param body
     * @return {Promise<void>}
     */
    async execute(body) {
        return {
            status: 200, body: 'NOT OVERRIDDEN',
        };
    }
};
