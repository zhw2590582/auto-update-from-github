var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var path = require('path');
var chalk = require('chalk');
var rm = require('rimraf').sync;
var download = require('download-git-repo');
var semver = require('semver');
var ora = require('ora');
var gitPackageJson = require('git-package-json');
var exists = require('fs').existsSync;
var logger = require('./logger');
var defaultOption = {
    git: '',
    dir: '.',
    freq: 3000
};
function aufg(option) {
    option = __assign({}, defaultOption, option);
    if (__dirname === path.resolve(option.dir)) {
        logger.fatal("You can't directly update the root directory");
    }
    var localPath = path.resolve(option.dir, 'package.json');
    var localPkg;
    try {
        require.cache[localPath] && delete require.cache[localPath];
        localPkg = require(localPath);
        updateGit(option.git, path.resolve(option.dir), localPkg.version, repeat);
    }
    catch (error) {
        logger.warn("Not found: " + localPath);
        downloadGit(option.git, path.resolve(option.dir), repeat);
    }
    function repeat() {
        setTimeout(function () {
            aufg(option);
        }, option.freq);
    }
}
function updateGit(git, dir, version, callback) {
    var spinner = ora("Loading " + git + "/package.json \n").start();
    gitPackageJson(git, function (err, data) {
        spinner.stop();
        if (err)
            throw err;
        if (semver.gt(data.version, version)) {
            logger.success("Found newer version: " + version + " => " + data.version);
            if (exists(dir))
                rm(dir);
            downloadGit(git, dir, callback);
        }
        else {
            logger.warn("Not found newer version: " + version);
            callback && callback();
        }
    });
}
function downloadGit(git, dir, callback) {
    var spinner = ora("Download git from " + git + " to " + dir).start();
    download(git, dir, function (err) {
        spinner.stop();
        if (err) {
            logger.fatal("Failed to download repo " + git + " : " + err.message.trim());
        }
        callback && callback();
        logger.success("Download git succeed");
    });
}
aufg({
    git: 'zhw2590582/obj-to-string',
    dir: './demo/',
    freq: 5000
});
module.exports = aufg;
