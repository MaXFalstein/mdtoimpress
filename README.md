# Markdown To Impress
A work in progress...

## What is it
`mdtoimpress` is a tool to convert markdown to impress pages.  Independent layout engines can exist to allow for different styles of presentation.

## How to install
+ Firstly you should install [nodejs](http://nodejs.org)
+ Then install it use `$ npm install -g mdtoimpress`

## How To Use
```bash
$ mdtoimpress␍␊

  Must have input and output arg!

  Usage: mdtoimpress [options]

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -i, --input <path>     Input markdown file path
    -o, --output <path>    Impress html file output path
    -l, --layout <layout>  layout engine to use (linear, radial)
    -v, --verbose          Switch on verbose output

  Examples:

    $ mdtoimpress -i file.md -o file.html -l linear
```

## Layout engines
There are Three Layout Engines


### Manual Layout
+ use `------` to separate each slide
+ use comment to set impress attr, such as `<!-- x=0 y=0 rotate=0 -->`
+ [this page](http://steel1990.github.io/markdown-impress/) is made by *markdown-impress* use [this markdown](https://raw.githubusercontent.com/steel1990/markdown-impress/master/README.md).
`$ mdtoimpress -i file.md -o file.html -l manual`

### Automatic Layout
* Use a blank line and hash-heading (i.e. `## example` ) to separate each slide

#### Linear Layout
* Slides are positioned left-to-right automatically
`$ mdtoimpress -i file.md -o file.html -l linear`

#### Radial Layout
* Slides are positioned in a circle according to heading depth
`$ mdtoimpress -i file.md -o file.html -l radial`



## Hacking
### Use in your code

    var fs = require('fs');
    var mtoi = require('markdown-impress');
    var content = mtoi('file.md');
    fs.writeFileSync('file.html', content);

### Writing a new Layout Engine

The best way to write a new layout engine is to clone one that's there already and change it until it fits your requirements.  If you copy `linear.js` and call it `vertical.js` then it would be used with `-l vertical` without any more configuration.

Layout Engines export four things.
1. `splitter` - a regular expression used to identify a slide boundary e.g. `/^(#+.*)$/mg`
2. `keepSplitterMatch` - a boolean which if `true` will keep the content that's matched by the regex.  If `false` whatever is matched is discarded and forms no part of the final document.
3. `overview` is a function which, if present, is called in order to add an additional overview slide to the deck.  
4. `layout` is a function that receives the markdown and returns HTML.


## Who made it?
The original code was by [steel1990](https://github.com/steel1990/markdown-impress).  This was missing a few fetures needed by [ear1grey](https://github.com/ear1grey) who added selectable layout engines, so that the original comment-based layouts could still work, but also, completely automatic layouts (capable of formatting pure unmodified MD) could also be laid out.
