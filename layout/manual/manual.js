"use strict";

let commentReg = /^\s*<!--\s*(.*?)\s*-->\s*$/gm,
    layoutSlide = (content) => {

        commentReg.lastIndex = 0;

        let data,
            match = commentReg.exec(content);

        if (match) {
            var metaArr = match[1].split(/\s+/);
            data = metaArr.map (
                (meta) => {
                    var kv = meta.split('=');
                    return [
                        kv[0].replace(/^data-/, ''),
                        kv[1].replace(/^('|")?(.*?)\1$/, '$2')
                    ];
                }
            );

        }
        return data.map(
            (meta) => `data-${meta[0]}=${meta[1]}`
        ).join(' ');
};

module.exports = {
    splitter: /(?:^-{6,}$)/mg,
    keepSplitterMatch: false,
    layout: (content) => content.map( (c) => {
        return { content: c, meta: layoutSlide(c) }
    } )
};
