# auto-update-from-github [![Build Status](https://www.travis-ci.org/zhw2590582/auto-update-from-github.svg?branch=master)](https://www.travis-ci.org/zhw2590582/auto-update-from-github)
> 自动同步 github 代码，支持检测 version 和 commit 

## Install

```
$ npm i -S auto-update-from-github
```

## Usage

```js
const aufg = require('auto-update-from-github');

aufg({
	git: 'username/repository', // 远程git地址
	dir: './repository', // 本地路径
	type: 'version', // 检测类型 version | commit
	freq: 3000 // 刷新频率
});
```

## License

MIT © [Harvey Zack](https://www.zhw-island.com/)
