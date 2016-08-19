"use strict";
var marked = require('marked'),
    fs = require('fs'),
    pathResolve = require('path').resolve,

    unique = "SPLITHERESPLITHERESPLITHERE",

   createSlideDiv = (slide) => {
     return `<div class="step" ${slide.meta} >${marked(slide.content)}</div>`;
   },

    readFile = function (path) {
        path = pathResolve(__dirname, path);
        var result;
        try {
          result = String(fs.readFileSync(path));
          console.log("Loaded:", path);
        } catch (e) {
          result = null;
          console.log("Not Loaded:", path);
        }

        return result;
    },

    createImpressHTML = function (html, layout) {
        var tpl = readFile('./res/impress.tpl');
        var data = {
            html: html,
            css: readFile('./res/impress.css'),
            themecss: layout.css,
            js: readFile('./res/impress.min.js')
        };
        return tpl.replace( /\{\{\$(\w+)\}\}/g, ($, $1) => data[$1] );
    },

    mdtoimpress = function (path, layoutFolder, verbosity) {

        let layout = {};
        layout.engineFN = `./layout/${layoutFolder}/${layoutFolder}.js`;
        layout.cssFN = `./layout/${layoutFolder}/${layoutFolder}.css`;
        layout.engine = require(layout.engineFN);
        layout.css = readFile(layout.cssFN);

        var
            // html defaults to empty if there is not an overview method
            // in the layout.engine.
            content = fs.readFileSync(path, 'utf8'),
            tempStr = content.replace(
                layout.engine.splitter,
                unique + (layout.engine.keepSplitterMatch ? "$&" : "")
            ),
            contentArr = tempStr.split(unique),
            slides = layout.engine.layout(contentArr, verbosity),
            html=layout.engine.overview ? layout.engine.overview() : '';


        slides.forEach( (s) => {
            html += createSlideDiv(s);
        });

        return createImpressHTML(html, layout);
    };

module.exports = mdtoimpress;
