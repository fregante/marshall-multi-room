const mem = require('mem');
const find = require('local-devices');
const pAny = require('p-any');
const fetch = require('node-fetch');
const {Parser} = require('xml2js');
const AbortController = require('abort-controller');

const getIP = mem(async () => {
	const devices = await find();
	const controller = new AbortController();

	const ip = await pAny(devices.map(async ({ip}) => {
		await call({ip, signal: controller.signal}, 'sys.info.friendlyname');
		return ip;
	}));
	controller.abort();
	return ip;
});

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
	url.searchParams.set('value', value);
	console.log(endpoint, value);
	const response = await fetch(url, {signal});
	const text = await response.text();
	return parseResponse(text);
}

exports.getIP = getIP;
exports.call = call;
