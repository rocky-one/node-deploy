const deployConfig = require('./deploy.config');
const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');
let versionFileOutput = deployConfig.versionFile.output;
let curVersionFile = [];
const localPath = deployConfig.localPath;
const evt = process.argv[2];
let serverInfo = evt == 'dev' ? deployConfig.deploy.dev : deployConfig.deploy.production;

if (!fs.existsSync(deployConfig.versionFile.output)) {
	fs.mkdirSync(deployConfig.versionFile.output);
};
const versionConfig = readVersionFile(deployConfig.versionFile.output);

if(versionConfig.curVersion){
	curVersionFile = require(`./${versionFileOutput}/${versionConfig.curVersion}`);
	
}



let versionFileList = [];
let mkdirFileList = [];
function readDirSync(path) {
	let pathList = fs.readdirSync(path);
	mkdirFileList.push(path.replace(localPath, '').replace('/', ''));
	pathList.forEach(function (filename, index) {
		let info = fs.statSync(path + "/" + filename);
		if (info.isDirectory()) {
			readDirSync(path + "/" + filename);
		} else {
			if (filename != '.DS_Store') {
				let fileArr = filename.split('.');
				let fileArrClone = fileArr.slice(0);
				versionFileList.push({
					name: filename,
					path: path,
					sortPath: path.replace(localPath, ''),
					nameGroup: fileArr,
					realName: fileArrClone.splice(0, fileArrClone.length - 2).join('.'),
					hashName: fileArrClone.join('.'),
					type: fileArr[fileArr.length - 1],
				})
			}

		}
	})
};
readDirSync(localPath);

// 对比json文件 
function contrast(pre, cur) {
	let res = [];// 需要重新部署的文件
	if (pre.length > 0) {
		pre.forEach(function (preItem, preIndex) {
			cur.forEach(function (curItem, curIndex) {
				if (preItem.path === curItem.path && preItem.realName === curItem.realName && preItem.hashName !== curItem.hashName) {
					res.push(curItem);
				}
				if (preItem.path === curItem.path && preItem.hashName === curItem.hashName && curItem.type==='html') {
					res.push(curItem);
				}
			});
		});
	} else {
		return cur;
	}
	return res;
}

let contrastResult = contrast(curVersionFile, versionFileList);

// 执行shell
function runShell(conn, cmd) {
	return new Promise(function (resolve, reject) {
		try {
			conn.shell(function (err, stream) {
				if (err) throw err;
				stream.on('close', function () {
					console.log('Stream :: close');
					// conn.end();
					resolve();
				}).on('data', function (data) {
					console.log('STDOUT: ' + data);
				}).stderr.on('data', function (data) {
					console.log('STDERR: ' + data);
				});
				stream.end(cmd);
			});
		} catch (e) {

		}

	});
}
// 链接远程服务 推送要部署的文件
function linkService(service) {
	if(contrastResult.length==0){
		console.log('没有需要更新的文件.');
		return;
	}
	let conn = new Client();
	conn.on('ready', async function () {
		let mkdirStr = '';
		for (var i = 0; i < mkdirFileList.length; i++) {
			mkdirStr += ' \nmkdir -p ' + mkdirFileList[i] + '\n';
		}
		await runShell(conn, 'cd / \ncd ' + service.path + '\n' + mkdirStr + ' \nls\n \nexit\n');
		conn.sftp(function (err, sftp) {
			contrastResult.forEach(function (item, index) {
				let paths = `${service.path}${item.sortPath}/${item.realName}.${item.hashName}`;
				let localpath = `${item.path}/${item.realName}.${item.hashName}`;
				if (item.type === 'html' || item.type === 'css') {
					paths = `${service.path}${item.sortPath}/${item.hashName}`;
					localpath = `${item.path}/${item.hashName}`;
				}
				sftp.fastPut(localpath, paths, function (err, result) {
					if (err) throw err;
					console.log( paths+': 文件部署完成');
					if(index === contrastResult.length-1){
						conn.end();
						writeVersionJson();
					}
				});
			});
			// sftp.fastPut( '/Users/abc/Documents/react/webpack3-react-redux-reactRouter4-master/qqqqqq.txt', '/home/www/htdocs/react/a/qqqqqq.txt', function (err, result) {
			// 	console.log(err)
			// 	conn.end();
			// });

			// sftp.fastGet('/home/www/htdocs/readme.html', '/Users/abc/Documents/react/webpack3-react-redux-reactRouter4-master/hh.html', function(err){  
			//       console.log(err);
			//       conn.end();
			//     });  
		});


	}).connect({
		host: service.host,
		port: service.port,
		username: service.user,
		password: service.password
	});
}
function serviceList(){
	serverInfo.forEach(function(service,index){
		linkService(service);
	});
};
serviceList();

// 读取现有的版本文件 计算当前的版本和下个版本号
function readVersionFile(path) {
	var newVersionNum = '1.0.0';
	let pathList = fs.readdirSync(path);
	if(pathList.length===0){
		return {
			curVersion:false,
			newVersion:newVersionNum
		};
	}
	let versionList = [];
	pathList.forEach(function (filename, index) {
		if (filename != '.DS_Store') {
			versionList.push(filename.replace('.json', '').split('.').join(''))
			
		}
	});
	versionList.sort(function (a, b) {
		return b - a;
	});
	let curVersion = parseInt(versionList[0])+1;
	newVersionNum = curVersion.toString().split('').join('.');
	return {
		curVersion:versionList[0].toString().split('').join('.')+'.json',
		newVersion:newVersionNum
	};
};
// 写入到json文件
function writeVersionJson(){
	
	fs.writeFile(__dirname + `/${deployConfig.versionFile.output}/${versionConfig.newVersion}.json`, JSON.stringify(versionFileList), function (err) {
		if (err) {
			console.error(err);
		} else {
			console.log('readVersionFile.json文件写入成功');
		}
	});
};
