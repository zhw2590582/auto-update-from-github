const chalk = require('chalk');
const format = require('util').format;
const dayjs = require('dayjs');
const prefix = 'aufg';
const sep = chalk.gray('·');

exports.log = function(...args) {
  const msg = format.apply(format, args);
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
  console.log(chalk.white(prefix), sep, time + ': ' + msg);
};

exports.fatal = function(...args) {
  if (args[0] instanceof Error) args[0] = args[0].message.trim();
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const msg = format.apply(format, args);
  console.error(chalk.red(prefix), sep, time + ': ' + msg);
  process.exit(1);
};

exports.success = function(...args) {
  const msg = format.apply(format, args);
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
  console.log(chalk.green(prefix), sep, time + ': ' + msg);
};

exports.warn = function(...args) {
  const msg = format.apply(format, args);
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
  console.log(chalk.yellow(prefix), sep, time + ': ' + msg);
};