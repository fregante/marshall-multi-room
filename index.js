const fetch = require('node-fetch');
const { Parser } = require('xml2js');
const keylogger = require('osx-keylogger');

keylogger.listen((_, key) => {
	switch (key) {
		case '<69>':
			volume = Math.min(10, volume + 1);
			call('netremote.sys.audio.volume', volume);
			break;
		case '<68>':
			volume = Math.max(0, volume - 1);
			call('netremote.sys.audio.volume', volume);
			break;
	}
}, './keymap.json');

async function call(endpoint, value) {
	const isSet = arguments.length > 1;
	const url = new URL(`http://192.168.1.96/fsapi/${isSet ? 'SET' : 'GET'}/${endpoint}/`);
	url.searchParams.set('pin', 1234);
	url.searchParams.set('value', value);
	const response = await fetch(url);
	const xml = await response.text();
	const { fsapiResponse } = await new Parser().parseStringPromise(xml);
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
	volume = await call('netremote.sys.audio.volume');
}

init();
