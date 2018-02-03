const fs = require('fs');
const createDir = (shellPath)  => {
	if (!fs.existsSync(shellPath)) {
		fs.mkdirSync(shellPath);
	};
};


module.exports = createDir;
