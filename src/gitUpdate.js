const { execSync } = require('child_process');

function gitUpdate(config){
  if(!config.gitBranchName) return true;
  const cwd = config.relativePath || '../';
  if(config.gitChangeCheck){
    // 查看当前状态
    const gitStatus = execSync('git status', {
        cwd,
        encoding: 'utf8'
    });
    if(gitStatus.indexOf('modified') > -1 || gitStatus.indexOf('git add') > -1){
        console.log('本地有修改代码，请先提交!');
        return false;
    }
  }
  // 切换分支
  execSync(`git checkout ${config.gitBranchName}`, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  // 拉取代码
  execSync(`git pull origin ${config.gitBranchName}`, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  // 更新依赖包
  config.installCommand && execSync(`${config.installCommand} install`, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  return true;
}

module.exports = gitUpdate;