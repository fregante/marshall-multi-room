const fetch = require('node-fetch');
const { Parser } = require('xml2js');
const readline = require('readline');

let volume;
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
	switch (key.name) {
		case 'c':
			process.exit();
		case 'up':
			volume++;
			set(volume);
			break;
		case 'down':
			volume--;
			set(volume);
			break;
		case 'space':
			play();
			break;
		default:
			console.log(`You pressed the "${str}" key`);
			console.log();
			console.log(key);
			console.log();
	}
});

async function set(value) {
	const url = new URL('http://192.168.1.96/fsapi/SET/netremote.sys.audio.volume/');
	url.searchParams.set('pin', 1234);
	url.searchParams.set('value', value);
	const response = await fetch(url);
	const xml = await response.text();
	const content = await new Parser().parseStringPromise(xml);
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
