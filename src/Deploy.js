const readrFileSync = require('../node/readrFileSync');
const linkClient = require('../node/linkClient');
const { sftps, runShell } = require('../node/clientUtil');
const fs = require('fs');
const path = require('path');
const createDir = require('../node/createDir');
const {gitPull} = require('../node/gitUtil');
const {runWebpack} = require('../node/runWebpack');
const createShell = require('../node/createShell');
// 输出html要对应文件夹深度, 回滚

class Deploy {
    constructor(config, callback) {
        this.config = config;
        this.willDeployList = [];
        this.mkdirFileList = [];
        this.preVersionJson = false;
        // gitPull(this.config.branchName);
        // createDir(this.config.shellPath);
        // createShell(this.config.shellPath);
        // runWebpack(this.config.shellPath,this.config.webpack)
        if(this.config.env =='back'){
            this.back();
        }else{
            this.initialization();
        
        }
        
    }
    initialization() {
        let versionFile = this.config.versionFile;
        let outputPath = versionFile.output + '/' + versionFile.fileName;
        this.outputPath = outputPath;
        createDir(outputPath);
        this.setVersion();
        createDir(this.outputPath + `/${this.versionNum}`);
        this.getPreVersionJson();
        this.getWillDeployInfo();
        this.contrast(this.preVersionJson, this.willDeployList);
        this.serviceQueue();
    }
    back() {
        let versionFile = this.config.versionFile;
        let outputPath = versionFile.output + '/' + versionFile.fileName;
        this.outputPath = outputPath;
        this.setVersion();
        this.backVersion = false;
        if(this.versionList.length>1){
            this.backVersion = this.versionList[1];
            fs.readFileSync(`${outputPath}/${backVersion}/${item.name}`)
        }
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
                versionList.push(filename.split('.').join(''));//replace('.json', '').
            }
        });
        versionList.sort(function (a, b) {
            return b - a;
        });
        this.versionList=versionList;
        let curVersion = parseInt(versionList[0]) + 1;
        this.preVersionNum = versionList[0].toString().split('').join('.');
        this.versionNum = curVersion.toString().split('').join('.');
    }
    getPreVersionJson() {
        if (this.preVersionNum) {
            let verPath = this.outputPath + `/${this.preVersionNum}`;
            this.preVersionJson = JSON.parse(fs.readFileSync(verPath + '/' + this.preVersionNum + '.json'));
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
            this.contrastResult=this.fileSort(cur);
            return;
        }
        this.contrastResult=this.fileSort(res);
        
    }
    fileSort(file){
        let htmlList = [];
        let other = [];
        file.forEach(function(item,index){
            if(item.type === 'html'){
                htmlList.push(item);
            }else{
                other.push(item)
            }
        });
        return other.concat(htmlList);
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
        let verPath = this.outputPath + `/${this.versionNum}`;
        createDir(verPath);
        fs.writeFileSync(verPath + `/${this.versionNum}.json`, JSON.stringify(this.willDeployList));
        this.willDeployList.forEach(function(item,index){
            if(item.type === 'html'){
                fs.writeFileSync(`${verPath}/${item.name}`, fs.readFileSync(`${item.path}/${item.name}`));
            }
        });
    }
}

module.exports = Deploy;