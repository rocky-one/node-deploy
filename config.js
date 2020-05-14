
const config = {
  ssh: [{
    // 服务器IP
    host: '192.168.11.22',
    // 端口
    port: 22,
    username: 'root',
    password: '123',
    // 部署到服务器的哪个目录
    deployDir: ['/mnt/app/web/dashboard/'],
    // 相当于是/mnt/app/web/mdd/build, build为了重命名解压出来的文件夹名称
    releaseDir: ['build']
  }],
  // 相对于哪个路径下，执行当前命令
  relativePath: '../',
  // 要拉取的分支名称
  gitBranchName:'dev',
  // 是否启用压缩, 如果不启用默认找本地压缩好的文件
  compress: true,
  // 本地压缩目录
  targetDir: ['./dist'],
  // 压缩文件名称
  targetFile: ['./dist.zip'],
  // 打包命令
  scriptCommand: 'build',
  // 校验本地代码是否变动，当为true时检查本地代码是否变动，如果本地代码有变动停止部署
  gitChangeCheck: false,
  // 安装依赖包命令
  installCommand: 'npm'
}

module.exports = config
