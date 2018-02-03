const fs = require('fs');
const createShell = (shellPath)  => {
	let shell = '#!/bin/bash\n for i in $@; do\n node $i\n done\n';
	fs.writeFileSync(shellPath + `/webpack.sh`, shell, function (err) {
		if (err) {
			console.error(err);
		} else {
			console.log('shell文件写入成功');
		}
	});
};


module.exports = createShell;
