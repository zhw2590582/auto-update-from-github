declare var module:any;
declare var require:any;

const pkg = require('./package.json');

interface Option {
    github: string;
    dir: string;
    frequency: number
}

function aufg(option: Option) {
    
}

aufg({
    github: 'https://github.com/zhw2590582/100plugins',
    dir: '.',
    frequency: 1000
});

module.exports = aufg;