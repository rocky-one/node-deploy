const execSync = require('child_process').execSync;
const path = require('path');
const runWebpack = (shellPath,webpackFile) => {
	try{
		let fileStr = webpackFile.join(' ');
		let cmd = path.join(`${shellPath}/webpack.sh ${fileStr}`);
		execSync(cmd);
	}catch(e){
		console.error('runWebpack错误: '+e);
	}
}

module.exports = {
	runWebpack: runWebpack
}