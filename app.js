const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const node_ssh = require('node-ssh')
const config = require ('./config')
const compressFiles = require ('./src/compressFiles')
const connectServe = require ('./src/connectServe')
const uploadFile = require ('./src/uploadFile')
const command = require ('./src/command')
const utils = require ('./src/utils')
const gitUpdate = require('./src/gitUpdate')
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
  // git更新
  if(!gitUpdate(config.gitBranchName)) return
  // 开始压缩
  if(config.compress){
    for(let i = 0; i < config.targetDir.length; i++){
      const strArr = config.targetDir[i].split('/')
      const folderName = strArr.pop()
      const localFile =  `${__dirname}/${config.targetFile[i]}`
      await compressFiles(config.targetDir[i], localFile, folderName)
    }
  }
  // 启动多线程
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
  for(let i = 0; i < sshs.length; i++) {
    const ssh = sshs[i]
    const nodeSsh = new node_ssh()
    await connectServe(ssh, nodeSsh)
    for(let j = 0; j < config.targetDir.length; j++){
      const strArr = config.targetDir[j].split('/')
      const folderName = strArr.pop()
      const targetArr = config.targetFile[j].split('/')
      const targetName = targetArr.pop()
      await uploadFile(nodeSsh, {
        targetFile: targetName,
        deployDir: ssh.deployDir[j],
        host: ssh.host
      }, `${__dirname}/${config.targetFile[j]}`)
      await command(nodeSsh, 'rm -rf ' + ssh.releaseDir[i], ssh.deployDir[j])
      // await command(nodeSsh, 'mkdir ' + ssh.releaseDir[i], ssh.deployDir[j])
      await command(nodeSsh, 'unzip -o ' + targetName, ssh.deployDir[j])
      await command(nodeSsh, `mv ${folderName} ${ssh.releaseDir[j]}`, ssh.deployDir[j]) 
      await command(nodeSsh, `mv ${targetName} ${utils.getCurrentTime()}.zip`, ssh.deployDir[j]) 
      await command(nodeSsh, 'rm -f ' + targetName, ssh.deployDir[j])
    }
    console.log(`${ssh.host} => 前端部署完成`)
  }
  return sshs;
}

