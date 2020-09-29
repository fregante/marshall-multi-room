const mem = require('mem');
const arp = require('@network-utils/arp-lookup');
const fetch = require('node-fetch');
const pRetry = require('p-retry');
const {Parser} = require('xml2js');
const {app, globalShortcut} = require('electron');

let volume;

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
	if (!isSet && returned && returned.length) {
		if (returned[0].u8) {
			return Number(returned[0].u8[0]);
		}

		console.log(returned);
		return returned[0];
	}
}

async function init() {
	await getIP();
	volume = await call('netremote.sys.audio.volume');

	app.dock.hide();
	await app.whenReady();

	globalShortcut.register('F11', () => {
		volume = Math.max(0, volume - 2);
		call('netremote.sys.audio.volume', volume);
	});
	globalShortcut.register('F12', () => {
		volume = Math.min(32, volume + 1);
		call('netremote.sys.audio.volume', volume);
	});
	globalShortcut.register('F8', () => {
		call('netremote.play.control', 2);
	});

	app.on('will-quit', () => {
		globalShortcut.unregisterAll();
	});
}

init();
