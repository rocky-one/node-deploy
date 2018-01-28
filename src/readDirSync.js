const fs = require('fs');

const _readDirSync = (path,rootPath,versionFileList,mkdirFileList) => {
	let pathList = fs.readdirSync(path);
	console.log(mkdirFileList,'mkdirFileList')
	mkdirFileList.push(path.replace(rootPath, '').replace('/', ''));
	pathList.forEach(function (filename, index) {
		let info = fs.statSync(path + "/" + filename);
		if (info.isDirectory()) {
			_readDirSync(path + "/" + filename,rootPath,versionFileList,mkdirFileList);
		} else {
			if (filename != '.DS_Store') {
				let fileArr = filename.split('.');
				let fileArrClone = fileArr.slice(0);
				versionFileList.push({
					name: filename,
					path: path,
					sortPath: path.replace(rootPath, ''),
					nameGroup: fileArr,
					realName: fileArrClone.splice(0, fileArrClone.length - 2).join('.'),
					hashName: fileArrClone.join('.'),
					type: fileArr[fileArr.length - 1],
				})
			}

		}
	})
}
const readDirSync = (path,rootPath) => {
	let versionFileList = [];
	let mkdirFileList = [];
	_readDirSync(path,rootPath,versionFileList,mkdirFileList);
	return {
		versionFileList: versionFileList,
		mkdirFileList: mkdirFileList
	}
}

module.exports = readDirSync;

