const request = require('../../util/request');
const config = require('../config');

module.exports = ({ url, method = 'get', options = {}, hasCommonParams = true }) => {
	const commonParams = hasCommonParams ? config.commonParams : {};
	const opts = Object.assign(options, commonParams, {
		headers: {
			referer: 'https://c.y.qq.com/',
			host: 'c.y.qq.com',
		},
	});
	if (process.env.DEBUG === 'true') {
		const logOpts = { ...opts, headers: { ...opts.headers } };
		const SENSITIVE_HEADER_KEYS = ['cookie', 'authorization', 'proxy-authorization'];

		if (logOpts.headers) {
			Object.keys(logOpts.headers).forEach(key => {
				if (SENSITIVE_HEADER_KEYS.includes(key.toLowerCase())) {
					logOpts.headers[key] = '[masked]';
				}
			});
		}

		console.log(url, { opts: logOpts });
	}
	return request(url, method, opts);
};
