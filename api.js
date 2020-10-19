const mdns = require('mdns');
const fetch = require('node-fetch');
const {Parser} = require('xml2js');
const AbortController = require('abort-controller');

function getIP() {
	return new Promise(resolve => {
		const controller = new AbortController();
		const browser = mdns.createBrowser(mdns.tcp('http'));
		browser.on('serviceUp', async service => {
			await call({
				ip: service.host,
				signal: controller.signal
			}, 'sys.info.friendlyname');
			controller.abort();
			browser.stop();
			resolve(service.host);
		});
		browser.start();
	});
}

async function parseResponse(xml) {
	const {fsapiResponse} = await new Parser().parseStringPromise(xml);
	if (fsapiResponse.status[0] !== 'FS_OK') {
		console.log(fsapiResponse);
		throw new Error(fsapiResponse.status[0]);
	}

	const returned = fsapiResponse.value;
	if (returned && returned.length > 0) {
		if (returned[0].u8) {
			return Number(returned[0].u8[0]);
		}

		return returned[0].c8_array[0];
	}
}

async function call({ip, signal}, endpoint, value) {
	const isSet = arguments.length > 2;
	const url = new URL(`http://${ip}/fsapi/${isSet ? 'SET' : 'GET'}/netremote.${endpoint}/`);
	url.searchParams.set('pin', 1234);
	if (typeof value === 'undefined') {
		console.log(endpoint);
	} else {
		url.searchParams.set('value', value);
		console.log(endpoint, value);
	}

	const response = await fetch(url, {signal});
	const text = await response.text();
	return parseResponse(text);
}

exports.getIP = getIP;
exports.call = call;
