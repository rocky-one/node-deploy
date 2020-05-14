const { execSync } = require('child_process')

function runBuild(config){
  execSync(`npm run ${config.scriptCommand}`, {
    cwd: config.relativePath || '../',
    encoding: 'utf8',
    stdio: 'inherit'
  })
}

module.exports = runBuild;
