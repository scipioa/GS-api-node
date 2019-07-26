const _ = require('lodash')

function Pictures(grandshooting) {
	this.grandshooting = grandshooting;

	this.name = 'pictures';
	this.key = 'picture';
}

Pictures.prototype.buildUrl = function (id, params = {}) {
	let path = `/${this.grandshooting.options.apiVersion}/picture`

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


Pictures.prototype.get = function (id, params) {
	const url = this.buildUrl(id, params);

	return this.grandshooting.request('GET', url, this.key);
};

Pictures.prototype.list = function (params) {
	const url = this.buildUrl(undefined, params);

	return this.grandshooting.request('GET', url, this.name);
};

module.exports = Pictures;