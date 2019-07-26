const _ = require('lodash')

function References(grandshooting) {
	this.grandshooting = grandshooting;

	this.name = 'references';
	this.key = 'reference';
}

References.prototype.buildUrl = function (id, params = {}) {
	let path = `/${this.grandshooting.options.apiVersion}/reference`

	if (typeof id !== 'undefined') {
		path += '/' + id
	}
	if (_.size(params) > 0) {
		path += '?'
		_.forEach(params, (value, key) => {
			path += `${key}=${value}&`
		})
		path = path.slice(0, -1)
	}

	return { ...this.grandshooting.baseUrl, headers: { ...this.grandshooting.baseUrl.headers }, path }
};


References.prototype.get = function (id, params) {
	const url = this.buildUrl(id, params);

	return this.grandshooting.request('GET', url, this.key);
};

References.prototype.list = function (params) {
	const url = this.buildUrl(undefined, params);

	return this.grandshooting.request('GET', url, this.name);
};

module.exports = References;