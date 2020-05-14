
// 连接服务器
function connectServe(sshInfo, nodeSsh) {
  return new Promise((resolve, reject) => {
    nodeSsh.connect({ ...sshInfo }).then(() => {
      console.log(`${sshInfo.host} 远程服务器连接成功！`);
      resolve();
    }).catch(err => {
      console.error(`${sshInfo.host} 连接失败!`, err);
      reject();
    });
  });
}

module.exports = connectServe;
