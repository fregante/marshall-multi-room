const {app, globalShortcut} = require('electron');
const {getIP, call} = require('./api');
const {Notification} = require('electron');
const pTimeout = require('p-timeout');

let volume;
let mute = false;

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

async function updateVolume(ip) {
	volume = await call({ip}, 'sys.audio.volume');
	mute = await call({ip}, 'sys.audio.mute');
	setTimeout(updateVolume, 1000 * 3600, ip); // Hourly
}

async function init() {
	app.setActivationPolicy('accessory');
	if (!app.isInApplicationsFolder()) {
		app.moveToApplicationsFolder();
		return;
	}

	const ip = await pTimeout(getIP(), 5000, 'No device could be found');
	updateVolume(ip);

	await app.whenReady();
	globalShortcut.register('F7', () => {
		call({ip}, 'play.control', 4).catch(notifyError);
	});
	globalShortcut.register('F8', () => {
		call({ip}, 'play.control', 2).catch(notifyError);
	});
	globalShortcut.register('F9', () => {
		call({ip}, 'play.control', 3).catch(notifyError);
	});
	globalShortcut.register('F10', () => {
		mute = !mute;
		call({ip}, 'sys.audio.mute', Number(mute)).catch(notifyError);
	});
	await app.whenReady();
	globalShortcut.register('F11', () => {
		volume = Math.floor(Math.max(0, volume - 1));
		call({ip}, 'sys.audio.volume', volume).catch(notifyError);
	});
	globalShortcut.register('F12', () => {
		volume = Math.min(32, volume + 1);
		call({ip}, 'sys.audio.volume', volume).catch(notifyError);
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
