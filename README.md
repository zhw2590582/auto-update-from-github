# auto-update-from-github [![Build Status](https://www.travis-ci.org/zhw2590582/auto-update-from-github.svg?branch=master)](https://www.travis-ci.org/zhw2590582/auto-update-from-github)
> 自动同步 github 代码：只要远程 github 仓库版本号比本地 github 仓库版本号高，就会自动覆盖

## Install

```
$ npm i -S auto-update-from-github
```

## Usage

```js
import aufg from 'auto-update-from-github';

aufg({
	git: 'username/repository', // 远程git地址
	dir: './repository', // 本地路径
	freq: 3000 // 刷新频率
});
```

## License

MIT © [Harvey Zack](https://www.zhw-island.com/)
