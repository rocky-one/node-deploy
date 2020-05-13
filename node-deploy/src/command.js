function command (ssh, command, path) {
  return new Promise((resolve, reject) => {
    ssh.execCommand(command, {
      cwd: path
    }).then((res) => {
      if (res.stderr) {
        console.error(res, '执行发生错误')
        reject(res.stderr)
        process.exit()
      } else {
        resolve()
      }
    })
  })
}

module.exports = command
