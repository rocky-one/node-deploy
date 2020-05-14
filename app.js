const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const node_ssh = require('node-ssh');
const config = require ('./config');
const compressFiles = require ('./src/compressFiles');
const connectServe = require ('./src/connectServe');
const uploadFile = require ('./src/uploadFile');
const command = require ('./src/command');
const utils = require ('./src/utils');
const gitUpdate = require('./src/gitUpdate');
const runBuild = require('./src/runBuild');

// 主线程
if (isMainThread) {
  main();
} else {
  (async () => {
    const workerResult = await runThreadTask(workerData.ssh);
    parentPort.postMessage(workerResult);
  })();
}


async function main() {
  // 更新git上代码
  if(!gitUpdate(config)) return;
  // 编译打包前端代码
  config.scriptCommand && runBuild(config);
  // 开始压缩
  if(config.compress){
    for(let i = 0; i < config.targetDir.length; i++){
      const strArr = config.targetDir[i].split('/');
      const folderName = strArr.pop();
      const localFile =  path.resolve(__dirname, config.relativePath, config.targetFile[i]);
      await compressFiles(path.resolve(__dirname, config.relativePath, config.targetDir[i]), localFile, folderName)
    }
  }
  // 启动子线程
  startThreads(config);
}

// 连接服务器 部署
async function runThreadTask(sshs) {
  for(let i = 0; i < sshs.length; i++) {
    const ssh = sshs[i];
    const nodeSsh = new node_ssh();
    await connectServe(ssh, nodeSsh);
    for(let j = 0; j < config.targetDir.length; j++){
      const strArr = config.targetDir[j].split('/');
      const folderName = strArr.pop();
      const targetArr = config.targetFile[j].split('/');
      const targetName = targetArr.pop();
      console.log(`开始上传${config.targetFile[j]} 压缩文件!`);
      console.log(`...`);
      await uploadFile(nodeSsh, {
        targetFile: targetName,
        deployDir: ssh.deployDir[j]
      }, path.resolve(__dirname, config.relativePath, config.targetFile[j]));
      console.log(`${config.targetFile[j]}文件上传完成!`);
      await command(nodeSsh, 'rm -rf ' + ssh.releaseDir[i], ssh.deployDir[j]);
      await command(nodeSsh, 'unzip -o ' + targetName, ssh.deployDir[j]);
      await command(nodeSsh, `mv ${folderName} ${ssh.releaseDir[j]}`, ssh.deployDir[j]);
      // 备份
      // await command(nodeSsh, `mv ${targetName} ${utils.getCurrentTime()}.zip`, ssh.deployDir[j]);
      await command(nodeSsh, 'rm -f ' + targetName, ssh.deployDir[j]);
      // 删除本地压缩的文件
      fs.unlinkSync(path.resolve(__dirname, config.relativePath, config.targetFile[j]));
    }
    console.log(`${ssh.host}环境前端部署完成!`);
  }
  return sshs;
}

// 开启多线程
function startThreads(config) {
  const threads = new Set();
  const sshLen = config.ssh.length;
  const threadCount = +process.argv[2] || 2;
  const sshGroup = Math.ceil(config.ssh.length / threadCount);
  let endSum = 0;
  for (let i = 0; i < threadCount; i++) {
    if (config.ssh.length === 0) break;
    threads.add(new Worker(__filename, {
      workerData: {
        ssh: config.ssh.splice(0, sshGroup)
      }
    }));
  }
  for (const worker of threads) {
    worker.on('message', msg => {
      endSum += msg.length;
      if (endSum === sshLen) {
        process.exit();
      }
    });
    worker.on('exit', msg => {
      threads.delete(worker);
    });
    worker.on('error', err => {
      throw err;
    });
  }
}