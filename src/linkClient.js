const Client = require('ssh2').Client;

const linkClient = (service,callback)  => {
	const _Client = new Client();
	_Client.on('ready', function(){
		callback(_Client);
	}).connect({
		host: service.host,
		port: service.port,
		username: service.user,
		password: service.password
	});
}

module.exports = linkClient;

