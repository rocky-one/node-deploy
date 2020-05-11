const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const node_ssh = require('node-ssh')
const config = require ('./config')
const compressFiles = require ('./src/compressFiles')
const connectServe = require ('./src/connectServe')
const uploadFile = require ('./src/uploadFile')
const command = require ('./src/command')
const utils = require ('./src/utils')
const { execSync } = require('child_process')
const strArr = config.targetDir.split('/')
const folderName = strArr.pop()
const sshLen = config.ssh.length;
let endSum = 0;
if (isMainThread) {
  main()
} else {
  (async () => {
    const workerRes = await start(workerData.ssh)
    parentPort.postMessage(workerRes)
  })()
}
async function main() {
  const gitStatus = execSync('git status', {
    cwd: '../',
    encoding: 'utf8'
  })
  // if(gitStatus.indexOf('modified') || gitStatus.indexOf('git add')){
  //   console.log('请先提交本地修改!')
  //   return
  // }
  // execSync(`git pull origin ${config.gitBranchName}`, {
  //   cwd: '../',
  //   encoding: 'utf8',
  //   stdio: 'inherit'
  // })
  const localFile =  `${__dirname}/${config.targetFile}`
  await compressFiles(config.targetDir, localFile, folderName)//压缩
  let threadCount = +process.argv[2] || 2
  let sshGroup = Math.ceil(config.ssh.length / threadCount)
  const threads = new Set()
  for(let i = 0; i < threadCount; i++){
    if(config.ssh.length === 0) break
    threads.add(new Worker(__filename, {
      workerData: {
        ssh: config.ssh.splice(0, sshGroup)
      }
    }))
  }
  for(const worker of threads) {
    worker.on('message', msg => {
      endSum += msg.length
      if(endSum === sshLen) {
        process.exit()
      }
    })
    worker.on('exit', msg => {
      threads.delete(worker)
    })
    worker.on('error', err => {
      throw err
    })
  }
}
async function start(sshs) {
  const localFile =  `${__dirname}/${config.targetFile}`
  for(let i = 0; i < sshs.length; i++) {
    const ssh = sshs[i]
    const nodeSsh = new node_ssh()
    await connectServe(ssh, nodeSsh)
    await uploadFile(nodeSsh, {
      targetFile: config.targetFile,
      deployDir: ssh.deployDir,
      host: ssh.host
    }, localFile)
    await command(nodeSsh, 'rm -rf ' + ssh.releaseDir, ssh.deployDir)
    await command(nodeSsh, 'mkdir ' + ssh.releaseDir, ssh.deployDir)
    await command(nodeSsh, 'unzip ' + config.targetFile, ssh.deployDir)
    await command(nodeSsh, `mv ${folderName} ${ssh.releaseDir}`, ssh.deployDir) 
    await command(nodeSsh, `mv ${config.targetFile} ${utils.getCurrentTime()}.zip`, ssh.deployDir) 
    await command(nodeSsh, 'rm -f ' + config.targetFile, ssh.deployDir)
    console.log(`${ssh.host} => 服务器部署完成`)
  }
  return sshs;
}

