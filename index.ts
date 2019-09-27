declare var module: NodeModule;
declare var require: NodeRequire;
declare var __dirname: string;

interface Option {
	git: string;
	dir: string;
	type: 'commit' | 'version';
	freq?: number;
}

const path = require('path');
const rm = require('rimraf').sync;
const download = require('download-git-repo');
const semver = require('semver');
const ora = require('ora');
const cheerio = require('cheerio');
const request = require('request');
const exists = require('fs').existsSync;
const writeJson = require('write-json');
const dayjs = require('dayjs');
const importFresh = require('import-fresh');
const logger = require('./logger');
const commitJson = './commit.json';

const defaultOption: Option = {
	git: '',
	dir: '.',
	type: 'version',
	freq: 0
};

function aufg(option: Option): void {
	option = (<any>Object).assign({}, defaultOption, option);
	const localDir = path.resolve(option.dir);

	if (__dirname === localDir) {
		logger.fatal(`You can't directly update the root directory`);
	}

	if (exists(localDir)) {
		if (option.type === 'version') {
			updateGitByVersion(option, repeat);
		} else if (option.type === 'commit') {
			updateGitByCommit(option, repeat);
		}
	} else {
		logger.warn(`Not found: ${localDir}`);
		downloadGit(option, repeat);
	}

	function repeat(): void {
		if (!option.freq) return;
		setTimeout(() => {
			aufg(option);
		}, option.freq);
	}
}

function updateGitByVersion(option: Option, callback): void {
	const { git, dir, type } = option;
	getLastVersion(git, newVersion => {
		const localVersion = getLocalVersion(dir);
		if (semver.gt(newVersion, localVersion)) {
			logger.success(`Found newer version: ${newVersion} => ${localVersion}`);
			if (exists(dir)) rm(dir);
			downloadGit(option, callback);
		} else {
			logger.warn(`Not found newer version: ${localVersion}`);
			callback();
		}
	});
}

function updateGitByCommit(option: Option, callback): void {
	const { git, dir, type } = option;
	getLastCommit(git, newTime => {
		const localTime = getLocalCommit(git);
		if (dayjs(localTime).isBefore(dayjs(newTime))) {
			logger.success(`Found newer commit: ${newTime} => ${localTime}`);
			if (exists(dir)) rm(dir);
			downloadGit(option, callback);
		} else {
			logger.warn(`Not found newer commit: ${localTime}`);
			callback();
		}
	});
}

function downloadGit(option: Option, callback): void {
	const { git, dir, type } = option;
	const localDir = path.resolve(dir);
	const spinner = ora(`Download git from ${git} to ${localDir} \n`).start();
	download(git, localDir, err => {
		spinner.stop();
		if (err) {
			logger.fatal(`Failed to download repo ${git} : ${err.message.trim()}`);
		}

		if (type === 'version') {
			callback();
		} else if (type === 'commit') {
			getLastCommit(git, newTime => {
				creatCommit(git, newTime, callback);
			});
		}

		logger.success(`Download git succeed`);
	});
}

function getLastCommit(git: string, callback): void {
	const commitUrl = `https://github.com/${git}/commits/master`;
	const spinner = ora(`Loading commit from ${commitUrl} \n`).start();
	request(commitUrl, (err, response, body) => {
		if (err) throw err;
		spinner.stop();
		const $ = cheerio.load(body);
		callback(
			$('.commits-listing ol')
				.eq(0)
				.find('relative-time')
				.attr('datetime')
		);
	});
}

function getLastVersion(git: string, callback): void {
	const packageJson = `https://github.com/${git}/blob/master/package.json`;
	const spinner = ora(`Loading version from ${packageJson} \n`).start();
	request(packageJson, (err, response, body) => {
		if (err) throw err;
		spinner.stop();
		const $ = cheerio.load(body);
		const data = JSON.parse($('.blob-wrapper table').text());
		callback(data.version);
	});
}

function creatCommit(git: string, time: string, callback): void {
	const oldCommit = exists(path.resolve(commitJson)) ? require(commitJson) : {};
	const newCommit = (<any>Object).assign({}, oldCommit, { [git]: time });
	writeJson(commitJson, newCommit, err => {
		if (err) throw err;
		callback();
	});
}

function getLocalCommit(git: string): string {
	return exists(path.resolve(commitJson))
		? importFresh(commitJson)[git] || ''
		: '';
}

function getLocalVersion(dir: string): string {
	const packageJson = path.resolve(dir, 'package.json');
	return exists(path.resolve(packageJson))
		? importFresh(packageJson).version || ''
		: '';
}

module.exports = aufg;
