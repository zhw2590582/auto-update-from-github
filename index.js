var path = require('path');
var rm = require('rimraf').sync;
var download = require('download-git-repo');
var semver = require('semver');
var ora = require('ora');
var cheerio = require('cheerio');
var request = require('request');
var exists = require('fs').existsSync;
var writeJson = require('write-json');
var dayjs = require('dayjs');
var importFresh = require('import-fresh');
var logger = require('./logger');
var commitJson = './commit.json';
var defaultOption = {
    git: '',
    dir: '.',
    type: 'version',
    freq: 0
};
function aufg(option) {
    option = Object.assign({}, defaultOption, option);
    var localDir = path.resolve(option.dir);
    if (__dirname === localDir) {
        logger.fatal("You can't directly update the root directory");
    }
    if (exists(localDir)) {
        if (option.type === 'version') {
            updateGitByVersion(option, repeat);
        }
        else if (option.type === 'commit') {
            updateGitByCommit(option, repeat);
        }
    }
    else {
        logger.warn("Not found: " + localDir);
        downloadGit(option, repeat);
    }
    function repeat() {
        if (!option.freq)
            return;
        setTimeout(function () {
            aufg(option);
        }, option.freq);
    }
}
function updateGitByVersion(option, callback) {
    var git = option.git, dir = option.dir, type = option.type;
    getLastVersion(git, function (newVersion) {
        var localVersion = getLocalVersion(dir);
        if (semver.gt(newVersion, localVersion)) {
            logger.success("Found newer version: " + newVersion + " => " + localVersion);
            if (exists(dir))
                rm(dir);
            downloadGit(option, callback);
        }
        else {
            logger.warn("Not found newer version: " + localVersion);
            callback();
        }
    });
}
function updateGitByCommit(option, callback) {
    var git = option.git, dir = option.dir, type = option.type;
    getLastCommit(git, function (newTime) {
        var localTime = getLocalCommit(git);
        if (dayjs(localTime).isBefore(dayjs(newTime))) {
            logger.success("Found newer commit: " + newTime + " => " + localTime);
            if (exists(dir))
                rm(dir);
            downloadGit(option, callback);
        }
        else {
            logger.warn("Not found newer commit: " + localTime);
            callback();
        }
    });
}
function downloadGit(option, callback) {
    var git = option.git, dir = option.dir, type = option.type;
    var localDir = path.resolve(dir);
    var spinner = ora("Download git from " + git + " to " + localDir + " \n").start();
    download(git, localDir, function (err) {
        spinner.stop();
        if (err) {
            logger.fatal("Failed to download repo " + git + " : " + err.message.trim());
        }
        if (type === 'version') {
            callback();
        }
        else if (type === 'commit') {
            getLastCommit(git, function (newTime) {
                creatCommit(git, newTime, callback);
            });
        }
        logger.success("Download git succeed");
    });
}
function getLastCommit(git, callback) {
    var commitUrl = "https://github.com/" + git + "/commits/master";
    var spinner = ora("Loading commit from " + commitUrl + " \n").start();
    request(commitUrl, function (err, response, body) {
        if (err)
            throw err;
        spinner.stop();
        var $ = cheerio.load(body);
        callback($('.commits-listing ol')
            .eq(0)
            .find('relative-time')
            .attr('datetime'));
    });
}
function getLastVersion(git, callback) {
    var packageJson = "https://github.com/" + git + "/blob/master/package.json";
    var spinner = ora("Loading version from " + packageJson + " \n").start();
    request(packageJson, function (err, response, body) {
        if (err)
            throw err;
        spinner.stop();
        var $ = cheerio.load(body);
        var data = JSON.parse($('.blob-wrapper table').text());
        callback(data.version);
    });
}
function creatCommit(git, time, callback) {
    var oldCommit = exists(path.resolve(commitJson)) ? require(commitJson) : {};
    var newCommit = Object.assign({}, oldCommit, (_a = {}, _a[git] = time, _a));
    writeJson(commitJson, newCommit, function (err) {
        if (err)
            throw err;
        callback();
    });
    var _a;
}
function getLocalCommit(git) {
    return exists(path.resolve(commitJson))
        ? importFresh(commitJson)[git] || ''
        : '';
}
function getLocalVersion(dir) {
    var packageJson = path.resolve(dir, 'package.json');
    return exists(path.resolve(packageJson))
        ? importFresh(packageJson).version || ''
        : '';
}
module.exports = aufg;
