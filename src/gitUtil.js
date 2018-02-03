const execSync = require('child_process').execSync
const isConflictReg = "^<<<<<<<\\s|^=======$|^>>>>>>>\\s"

const gitPull = (branchName) => {
	// if(execSync(`git grep -n -P "${isConflictReg}"`, {encoding: 'utf-8'})){
	// 	reject('代码冲突，请解决冲突')
	// }
	try {
		let gitRes = execSync(`git pull origin ${branchName}`)
	} catch (e) {
		console.error('git错误: ' + e)
	}
}

module.exports = {
	gitPull: gitPull
}