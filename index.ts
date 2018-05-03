declare var module: any;
declare var require: any;
declare var __dirname: any;

interface Option {
	git: string;
	dir: string;
	freq: number;
}

const path = require('path');
const chalk = require('chalk');
const rm = require('rimraf').sync;
const download = require('download-git-repo');
const semver = require('semver');
const ora = require('ora');
const gitPackageJson = require('git-package-json');
const exists = require('fs').existsSync;
const logger = require('./logger');

const defaultOption: Option = {
	git: '',
	dir: '.',
	freq: 3000
};

function aufg(option: Option): void {
	option = { ...defaultOption, ...option };
	if (__dirname === path.resolve(option.dir)) {
		logger.fatal(`You can't directly update the root directory`);
	}
	let localPath = path.resolve(option.dir, 'package.json');
	let localPkg;
	try {
		require.cache[localPath] && delete require.cache[localPath];
		localPkg = require(localPath);
		updateGit(option.git, path.resolve(option.dir), localPkg.version, repeat);
	} catch (error) {
		logger.warn(`Not found: ${localPath}`);
		downloadGit(option.git, path.resolve(option.dir), repeat);
	}

	function repeat(): void {
		setTimeout(() => {
			aufg(option);
		}, option.freq);
	}
}

function updateGit(git: string, dir: string, version: string, callback): void {
	const spinner = ora(`Loading ${git}/package.json \n`).start();
	gitPackageJson(git, (err, data) => {
		spinner.stop();
		if (err) throw err;
		if (semver.gt(data.version, version)) {
			logger.success(`Found newer version: ${version} => ${data.version}`);
			if (exists(dir)) rm(dir);
			downloadGit(git, dir, callback);
		} else {
			logger.warn(`Not found newer version: ${version}`);
			callback && callback();
		}
	});
}

function downloadGit(git: string, dir: string, callback): void {
	const spinner = ora(`Download git from ${git} to ${dir}`).start();
	download(git, dir, err => {
		spinner.stop();
		if (err) {
			logger.fatal(`Failed to download repo ${git} : ${err.message.trim()}`);
		}
		callback && callback();
		logger.success(`Download git succeed`);
	});
}

aufg({
	git: 'zhw2590582/obj-to-string',
	dir: './demo/',
	freq: 5000
});

module.exports = aufg;