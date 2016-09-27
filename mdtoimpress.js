#! /usr/bin/env node
"use strict";

var mdtoimpress = require('./index.js');
var program = require('commander');
var path = require('path');
var fs = require('fs');
var pkg = require('./package');
var layout;

program.version(pkg.version)
    .option('-i, --input <path>', 'Input markdown file path')
    .option('-o, --output <path>', 'Impress html file output path')
    .option('-l, --layout <layout>', 'layout engine to use (linear, radial)')
    .option('-v, --verbose', 'Switch on verbose output',
        (v, total) => {
            return total + 1;
        },
        0
    )
    .on('--help',
        () => {
            console.log('  Examples:\n');
            console.log('    $ mdtoimpress -i file.md -o file.html -l linear\n');
        }
    )
    .parse(process.argv);

if (!program.input || !program.output) {
    console.log('');
    console.log('  Must have input and output arg!');
    program.help();
    process.exit();
}

// select the layout engine
if (!program.layout) {
    program.layout = "manual";
}

var basePath = process.cwd();
var input = path.resolve(basePath, program.input);
var output = path.resolve(basePath, program.output);

var html = mdtoimpress(input, program.layout, program.verbose);
fs.writeFileSync(output, html);
