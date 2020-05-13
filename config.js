
const config = {
  ssh: [{
    // 服务器IP
    host: '192.168.123.123',
    // 端口
    port: 22,
    username: 'root',
    password: '123',
    // 部署到服务器的哪个目录
    deployDir: ['/mnt/app/web/mr/', '/mnt/app/web/mdd/', '/mnt/app/web/dashboard/'],
    // 相当于是/mnt/app/web/mdd/build, build为了重命名解压出来的文件夹名称
    releaseDir: ['build', 'build', 'build']
  }],
  // 相对于哪个路径下，执行当前命名
  relativePath: './',
  // 要拉取的分支名称
  gitBranchName:'',
  // 是否启用压缩, 如果不启用默认找本地压缩好的文件
  compress: false,
  // 本地压缩目录
  targetDir: ['./mr/dist', './mdd/dist', './dashboard/dist'],
  // 压缩文件名称
  targetFile: ['./mr/dist.zip', './mdd/dist.zip', './dashboard/dist.zip'],
}

module.exports = config
