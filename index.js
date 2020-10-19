const {app, globalShortcut} = require('electron');
const {getIP, call} = require('./api');
const pTimeout = require('p-timeout');

let volume;

async function init() {
	app.dock.hide();
	const ip = await pTimeout(getIP(), 5000, 'No device could be found');
	volume = await call({ip}, 'sys.audio.volume');

	await app.whenReady();

	globalShortcut.register('F11', () => {
		volume = Math.max(0, volume - 2);
		call({ip}, 'sys.audio.volume', volume);
	});
	globalShortcut.register('F12', () => {
		volume = Math.min(32, volume + 1);
		call({ip}, 'sys.audio.volume', volume);
	});
	globalShortcut.register('F8', () => {
		call({ip}, 'play.control', 2);
	});

	app.on('will-quit', () => {
		globalShortcut.unregisterAll();
	});
}

init();
