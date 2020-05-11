async function uploadFile (ssh, config, localFile) {
  return new Promise((resolve, reject) => {
    ssh.putFile(localFile, config.deployDir + config.targetFile).then(async () => {
      console.log(`${config.host} => 文件上传完成`)
      resolve()
    }, (err) => {
      reject(err)
    })
  })
}

module.exports = uploadFile