const {app, globalShortcut} = require('electron');
const {getIP, call} = require('./api');

let volume;

async function init() {
	app.dock.hide();
	// const ip = await getIP();
	// volume = await call({ip}, 'sys.audio.volume');

	await app.whenReady();
	const { BrowserWindow } = require('electron')
	let win = new BrowserWindow({ width: 800, height: 600, frame: false, transparent: true, show: false, alwaysOnTop: true})
	win.center();
win.once('ready-to-show', () => {
	win.show();
	win.webContents.insertText('#############################')
})
	win.setIgnoreMouseEvents(true)
	await win.loadFile('overlay.html')
	return;

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
