async function uploadFile (ssh, config, localFile) {
  return new Promise((resolve, reject) => {
    ssh.putFile(localFile, config.deployDir + config.targetFile).then(async () => {
      console.log(`${config.host} => ${config.deployDir}${config.targetFile}文件上传完成`)
      resolve()
    }, (err) => {
      console.log(err, '上传错误')
      reject(err)
    })
  })
}

module.exports = uploadFile