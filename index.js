const {app, globalShortcut} = require('electron');
const {getIP, call} = require('./api');
const {Notification} = require('electron');
const pTimeout = require('p-timeout');

let volume;

async function notify(body, titleDetail) {
	await app.whenReady();

	new Notification({
		body,
		title: 'Marshall' + (titleDetail ? ': ' + titleDetail : ''),
		silent: true
	}).show();
}

function notifyError(error) {
	notify(error.message, 'Error');
}

async function init() {
	app.setActivationPolicy('accessory');
	const ip = await pTimeout(getIP(), 5000, 'No device could be found');
	volume = await call({ip}, 'sys.audio.volume');

	await app.whenReady();
	globalShortcut.register('F11', () => {
		volume = Math.floor(Math.max(0, volume * 0.7));
		call({ip}, 'sys.audio.volume', volume).catch(notifyError);
	});
	globalShortcut.register('F12', () => {
		volume = Math.min(32, volume + 1);
		call({ip}, 'sys.audio.volume', volume).catch(notifyError);
	});
	globalShortcut.register('F8', () => {
		call({ip}, 'play.control', 2).catch(notifyError);
	});

	app.on('will-quit', () => {
		globalShortcut.unregisterAll();
	});
}

init().catch(async error => {
	notifyError(error);
	setTimeout(() => {
		// Leave notification on screen for 5 seconds
		app.exit();
	}, 5000);
});
