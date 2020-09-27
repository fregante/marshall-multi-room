const fetch = require('node-fetch');
const { Parser } = require('xml2js');

const keylogger = require('osx-keylogger');

keylogger.listen((_, key) => {
	switch (key) {
		case '<69>':
			volume = Math.min(10, volume + 1);
			set(volume);
			break;
		case '<68>':
			volume--;
			set(volume);
			break;
	}
}, './keymap.json');

async function set(value) {
	const url = new URL('http://192.168.1.96/fsapi/SET/netremote.sys.audio.volume/');
	url.searchParams.set('pin', 1234);
	url.searchParams.set('value', value);
	const response = await fetch(url);
	const xml = await response.text();
}
async function get() {
	const url = new URL('http://192.168.1.96/fsapi/GET/netremote.sys.audio.volume/');
	url.searchParams.set('pin', 1234);
	const response = await fetch(url);
	const xml = await response.text();
	const { fsapiResponse } = await new Parser().parseStringPromise(xml);
	return Number(fsapiResponse.value[0].u8[0]);
}
async function play() {
	const url = new URL('http://192.168.1.96/fsapi/SET/netremote.play.control/');
	url.searchParams.set('pin', 1234);
	url.searchParams.set('value', 2);
	const response = await fetch(url);
	const xml = await response.text();
	const { fsapiResponse } = await new Parser().parseStringPromise(xml);
	console.log(fsapiResponse);
}
async function init() {
	volume = await get();
}

init();
