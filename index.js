"use strict";
var marked = require('marked'),
    fs = require('fs'),
    pathResolve = require('path').resolve,

    unique = "SPLITHERESPLITHERESPLITHERE",

   createSlideDiv = (slide) => {
//     let bg = slide.parent && slide.parent.hue ? slide.parent.hue : "#fff";
     return `<div class="step" style="background: ${slide.hue}" ${slide.meta} >${marked(slide.content)}</div>`;
   },

    readFile = function (path) {
        path = pathResolve(__dirname, path);
        return String(fs.readFileSync(path));
    },

    createImpressHTML = function (html) {
        var tpl = readFile('./res/impress.tpl');
        var data = {
            html: html,
            css: readFile('./res/impress.css'),
            js: readFile('./res/impress.min.js')
        };
        return tpl.replace( /\{\{\$(\w+)\}\}/g, ($, $1) => data[$1] );
    },

    processMarkdownFile = function (path, layoutEngine, verbosity) {

        var
            // html defaults to empty if there is not an overview method
            // in the layoutEngine.
            content = fs.readFileSync(path, 'utf8'),
            tempStr = content.replace(
                layoutEngine.splitter,
                unique + (layoutEngine.keepSplitterMatch ? "$&" : "")
            ),
            contentArr = tempStr.split(unique),
            slides = layoutEngine.layout(contentArr, verbosity),
            html=layoutEngine.overview ? layoutEngine.overview() : '';


        slides.forEach( (s) => {
            html += createSlideDiv(s);
        });



        return createImpressHTML(html);
    };

module.exports = processMarkdownFile;
