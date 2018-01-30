const readrFileSync = require('../node/readrFileSync');
const linkClient = require('../node/linkClient');
const { sftps, runShell } = require('../node/clientUtil');
const fs = require('fs');
const path = require('path');

// 读取git   执行编译    版本回滚

class Deploy {
    constructor(config, callback) {
        this.config = config;
        this.willDeployList = [];
        this.mkdirFileList = [];
        this.preVersionJson = false;
        this.initialization();
    }
    initialization() {
        let versionFile = this.config.versionFile;
        let outputPath = versionFile.output + '/' + versionFile.fileName;
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        };
        this.outputPath = outputPath;
        this.setVersion();
        this.getPreVersionJson();
        this.getWillDeployInfo();
        this.contrast(this.preVersionJson, this.willDeployList);
        this.serviceQueue();
    }
    setVersion() {
        this.versionNum = '1.0.0';
        let pathList = fs.readdirSync(this.outputPath);
        if (pathList.length === 0) {
            this.preVersionNum = false;
            return;
        }
        let versionList = [];
        pathList.forEach(function (filename, index) {
            if (filename != '.DS_Store') {
                versionList.push(filename.replace('.json', '').split('.').join(''))
            }
        });
        versionList.sort(function (a, b) {
            return b - a;
        });
        let curVersion = parseInt(versionList[0]) + 1;
        this.preVersionNum = versionList[0].toString().split('').join('.') + '.json';
        this.versionNum = curVersion.toString().split('').join('.');
    }
    getPreVersionJson() {
        if (this.preVersionNum) {
            this.preVersionJson = JSON.parse(fs.readFileSync(this.outputPath + '/' + this.preVersionNum));
        }

    }
    // 对比json文件 
    contrast(pre, cur) {
        let res = [];// 需要重新部署的文件
        if (pre.length > 0) {
            pre.forEach(function (preItem, preIndex) {
                cur.forEach(function (curItem, curIndex) {
                    if (preItem.path === curItem.path && preItem.realName === curItem.realName && preItem.hashName !== curItem.hashName) {
                        res.push(curItem);
                    }
                    if (preItem.path === curItem.path && preItem.hashName === curItem.hashName && curItem.type === 'html') {
                        res.push(curItem);
                    }
                });
            });
        } else {
            this.contrastResult=cur;
            return;
        }
        this.contrastResult=res;
    }
    getWillDeployInfo() {
        let deployInfo = readrFileSync(this.config.localPath, this.config.localPath);
        this.willDeployList = deployInfo.versionFileList;
        this.mkdirFileList = deployInfo.mkdirFileList;
    }
    linkService(service){
        var self = this;
        linkClient(service, async function (_Client) {
            let mkdirStr = '';
            for (var i = 0; i < self.mkdirFileList.length; i++) {
                mkdirStr += ' \nmkdir -p ' + self.mkdirFileList[i] + '\n';
            }
            await runShell(_Client, 'cd / \ncd ' + service.path + '\n' + mkdirStr + ' \nls\n \nexit\n');
            // 这里处理sftp相关的内容
            sftps(_Client).then((sftp) => {
                self.contrastResult.forEach(function (item, index) {
                    let paths = `${service.path}${item.sortPath}/${item.realName}.${item.hashName}`;
                    let localpath = `${item.path}/${item.realName}.${item.hashName}`;
                    if (item.type === 'html' || item.type === 'css' || item.type === 'json') {
                        paths = `${service.path}${item.sortPath}/${item.hashName}`;
                        localpath = `${item.path}/${item.hashName}`;
                    }
                    sftp.fastPut(localpath, paths, function (err, result) {
                        if (err) throw err;
                        console.log( paths+': 文件部署完成');
                        if(index === self.contrastResult.length-1){
                            _Client.end();
                            self.writeVersionJson();
                        }
                    });
                });
            });
        });
    }
    serviceQueue(){
        let evt = this.config.env;
        let serviceList = [];
        let selt = this;
        if(evt === 'development'){
            serviceList = this.config.development;
        }else if(evt === 'production'){
            serviceList = this.config.production;
        }else if(evt === 'developmentAndProduction'){
            serviceList = this.config.development.concat(this.config.production);
        }
        serviceList.forEach(function(service,index){
            selt.linkService(service);
        });
    }
    // 写入到json文件
    writeVersionJson(){
        fs.writeFile(this.outputPath + `/${this.versionNum}.json`, JSON.stringify(this.willDeployList), function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log('json文件写入成功');
            }
        });
    }
}

module.exports = Deploy;