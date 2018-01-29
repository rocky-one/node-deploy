
const runShell = (client,cmd,close)  => {
	return new Promise(function (resolve, reject) {
		try {
			client.shell(function (err, stream) {
				if (err) throw err;
				stream.on('close', function () {
					console.log('Stream :: close');
					if(close){
						client.end();
					}
					resolve();
				}).on('data', function (data) {
					console.log('STDOUT: ' + data);
				}).stderr.on('data', function (data) {
					console.log('STDERR: ' + data);
				});
				stream.end(cmd);
			});
		} catch (e) {
			throw e;
		}

	});
};

const sftps = (client) => {
	return new Promise((resolve,reject) => {
		try{
			client.sftp((err, sftp)=>{
				resolve(sftp)
			});
		}catch(e){
			throw e;
		}
	});
}


module.exports = {
	runShell:runShell,
	sftps:sftps,
};

