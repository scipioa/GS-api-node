const EventEmitter = require('events')
const fs = require('fs')
const got = require('got')
const path = require('path')
const _ = require('lodash')
const { pRateLimit } = require('p-ratelimit')

const pkg = require('./package')

function GrandShooting(options) {
	if (!(this instanceof GrandShooting)) return new GrandShooting(options);
	if (
		!options ||
		!options.apiKey
	) {
		throw new Error('Missing or invalid options');
	}

	EventEmitter.call(this);
	this.options = _.defaults(options, {
		apiVersion: 'v2',
		hostname: 'api.grand-shooting.com',
		protocol: 'https:',
		timeout: 60000
	});

	this.baseUrl = {
		headers: {},
		hostname: options.hostname,
		protocol: options.protocol,
		port: options.port
	};
}

GrandShooting.prototype.limit = pRateLimit({
	interval: 1000,
	rate: 5,
})


GrandShooting.prototype.request = function request(method, urlObj, key, params) {
	return this.limit(() => {
		const self = this
		const url = typeof urlObj === 'string' ? {
				...this.baseUrl,
				path: `/${this.options.apiVersion}${_.startsWith(urlObj, '/') ? '' : '/'}${urlObj}`
			} : { ...urlObj }
		const options = {
			...url,
			timeout: this.options.timeout,
			json: true,
			retries: 0,
			method
		}

		options.headers['User-Agent'] = `${pkg.name}/${pkg.version}`;

		if (this.options.apiKey) {
			options.headers['Authorization'] = 'Bearer ' + this.options.apiKey;
		}

		if (params) {
			const body = key ? { [key]: params } : params;

			options.headers['Content-Type'] = 'application/json';
			options.body = body;
		}

		return got(options).then(res => {
			const body = res.body;
			const offset = parseInt(res.headers['x-offset'])
			const count = parseInt(res.headers['x-count'])
			const totalCount = parseInt(res.headers['x-total-count'])
			if (!isNaN(offset)) {
				const previous = offset <= 0 ? null : function() {
					const _options = _.assign({}, options)
					_options.headers['offset'] = Math.max(offset - count, 0)
					return self.request(method, _options, key, params)
				}
				const next = offset + count >= totalCount ? null : function () {
					const _options = _.assign({}, options)
					_options.headers['offset'] = offset + count
					return self.request(method, _options, key, params)
				}
				return {
					[key]: body || {},
					prev: previous,
					next: next
				};
			} else {
				return body || {};
			}
		}, err => {

			return Promise.reject(err);
		})
	});
};

fs.readdirSync(path.join(__dirname, 'resources')).forEach(name => {
	const prop = _.camelCase(name.slice(0, -3));

	Object.defineProperty(GrandShooting.prototype, prop, {
		get: function get() {
			const resource = require(`./resources/${name}`);

			return Object.defineProperty(this, prop, {
				value: new resource(this)
			})[prop];
		},
		set: function set(value) {
			return Object.defineProperty(this, prop, { value })[prop];
		}
	});
});

module.exports = GrandShooting;