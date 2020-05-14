const fs = require('fs');
const archiver = require('archiver');

function compressFiles(targetDir, localFile, compressFolderName = 'dist') {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(localFile);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    output.on('close', () => {
      console.log(`压缩完成 文件大小 ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve();
    }).on('error', err => {
      console.error(err, '压缩失败')
      reject(err);
    });
    archive.pipe(output);
    archive.directory(targetDir, compressFolderName);
    archive.finalize();
  });
}

module.exports = compressFiles;
