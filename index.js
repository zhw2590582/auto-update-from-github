var path = require('path');
var rm = require('rimraf').sync;
var download = require('download-git-repo');
var semver = require('semver');
var ora = require('ora');
var cheerio = require('cheerio');
var request = require('request');
var exists = require('fs').existsSync;
var logger = require('./logger');
var defaultOption = {
    git: '',
    dir: '.',
    freq: 0
};
function aufg(option) {
    option = Object.assign({}, defaultOption, option);
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
        if (!option.freq)
            return;
        setTimeout(function () {
            aufg(option);
        }, option.freq);
    }
}
function updateGit(git, dir, version, callback) {
    var packageJson = "https://github.com/" + git + "/blob/master/package.json";
    var spinner = ora("Loading " + packageJson + " \n").start();
    request(packageJson, function (err, response, body) {
        if (err)
            throw err;
        spinner.stop();
        var $ = cheerio.load(body);
        try {
            var data = JSON.parse($('.blob-wrapper table').text());
            if (semver.gt(data.version, version)) {
                logger.success("Found newer version: " + version + " => " + data.version);
                if (exists(dir))
                    rm(dir);
                downloadGit(git, dir, callback);
            }
            else {
                logger.warn("Not found newer version: " + version);
                callback();
            }
        }
        catch (error) {
            logger.fatal(error.message.trim());
        }
    });
}
function downloadGit(git, dir, callback) {
    var spinner = ora("Download git from " + git + " to " + dir + " \n").start();
    download(git, dir, function (err) {
        spinner.stop();
        if (err) {
            logger.fatal("Failed to download repo " + git + " : " + err.message.trim());
        }
        callback();
        logger.success("Download git succeed");
    });
}
module.exports = aufg;
