
const config = {
  ssh: [{
    // 服务器IP
    host: '39.105.123.123',
    // 端口
    port: 22,
    username: 'root',
    password: '123456',
    // 部署到服务器的哪个目录
    deployDir: '/root/mdd/web/',
    // 相当于是/root/mdd/web/build, build为了重命名解压出来的文件夹名称
    releaseDir: 'build'
  }],
  // 要拉取的分支名称
  gitBranchName:'dev',
  // 压缩目录
  targetDir: '../dist',
  // 压缩文件名称
  targetFile: 'dist.zip',
}

module.exports = config
