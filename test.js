const {getIP} = require('./api');

async function init() {
	console.log(await getIP());
}

init();
