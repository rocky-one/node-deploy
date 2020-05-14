async function uploadFile(ssh, config, localFile) {
  return new Promise((resolve, reject) => {
    ssh.putFile(localFile, config.deployDir + config.targetFile).then(() => {
      resolve();
    }, err => {
      console.log(err, '上传错误');
      reject(err);
    });
  });
}

module.exports = uploadFile;
