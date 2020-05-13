const { execSync } = require('child_process')

function gitUpdate(config){
    if(!config.gitBranchName) return true
    const gitStatus = execSync('git status', {
        cwd: config.relativePath || '../',
        encoding: 'utf8'
    })
    if(gitStatus.indexOf('modified') || gitStatus.indexOf('git add')){
        console.log('请先提交本地修改!')
        return false
    }
    execSync(`git pull origin ${config.gitBranchName}`, {
        cwd: config.relativePath || '../',
        encoding: 'utf8',
        stdio: 'inherit'
    })
}

module.exports = gitUpdate