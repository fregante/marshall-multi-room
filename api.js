const mem = require('mem');
const arp = require('@network-utils/arp-lookup');
const fetch = require('node-fetch');
const pRetry = require('p-retry');
const {Parser} = require('xml2js');

const getIP = mem(async () => {
	console.log('will get IP');
	const table = await arp.getTable();
	const device = table.find(({vendor}) => vendor.startsWith('Frontier'));
	console.log(device?.ip);
	return device?.ip;
});

async function request(url) {
	return pRetry(() => fetch(url), {
		onFailedAttempt: async () => {
			console.log('will retry');
			mem.clear(getIP);
			url.host = await getIP();
		}
	});
}

async function call(endpoint, value) {
	const isSet = arguments.length > 1;
	console.log('will call');
	const url = new URL(`http://${await getIP()}/fsapi/${isSet ? 'SET' : 'GET'}/${endpoint}/`);
	url.searchParams.set('pin', 1234);
	url.searchParams.set('value', value);
	console.log('will request');
	const response = await request(url);
	console.log('got it');
	const xml = await response.text();
	const {fsapiResponse} = await new Parser().parseStringPromise(xml);
	if (fsapiResponse.status[0] !== 'FS_OK') {
		console.log(fsapiResponse);
		throw new Error(fsapiResponse.status[0]);
	}

	const returned = fsapiResponse.value;
	if (!isSet && returned && returned.length > 0) {
		if (returned[0].u8) {
			return Number(returned[0].u8[0]);
		}

		console.log(returned);
		return returned[0];
	}
}

exports.getIP = getIP;
exports.call = call;
