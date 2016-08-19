"use strict";

const TAU = 2 * Math.PI;
const RAD = 57.3;
const slideRadius = Math.sqrt((1000 * 1000) + (700 * 700));
const nnn = 10000; // jiggling number - how many times do we move each slide to ensure a compact layout?
const shrinkFactor = 0.75;

let
    deepest = 0,
    sid = 0;

class Slide {
    constructor(content, depth) {
        this._id = ++sid; // auto incrementing slide id
        this._radius = slideRadius;
        this._angle = Math.PI;
        this.parent = 0; // there is no slide 0 - i.e. default false parent
        this.content = content;
        this.depth = depth;
        this.scale=1;
        this._offset = 5*slideRadius;  // a large gap between slides before its reduced by the fitting routine.
    }

    get liveDepth() {
        return (this.parent ? this.parent.depth : 0) + 1;
    }

    get hue() {
        return `hsl(${this.overallAngle},${(this.depth-1)/deepest*100}%,75%)`;
    }

    get overallAngle() {
      // TODO final multiplier is a hack.  should be radians or similar
      return (this.parent ? this.parent.overallAngle : 0) + (this.angle * 40);
    }


    get id() {
        return this._id;
    }

    get localx() {
      return ;
    }

    get x() {
        return (this.parent ? this.parent.x : 0) + this.offset * Math.sin(this.angle);
    }

    get y() {
        return (this.parent ? this.parent.y : 0) + this.offset * Math.cos(this.angle);
    }

    get raw() {
        if (this.parent) {
            return `s${this.id} p${this.parent.id} g${this.radius} c${this.content.slice(0,6)} angle${this.angle}`;
        } else {
            return `s${this.id} TOP angle${this.angle}`;
        }
    }

    get radius() {
        return this._radius;
    }

    get offset() {
        return this._offset;
    }

    reduceOffset() {
        this._offset -= 1;
    }
    increaseOffset() {
        this._offset += 1;
    }

    set radius(g) {
        if (g) {
            this._radius = g;
        }
    }

    get angle() {
        return this._angle;
    }



    set angle(a) {
        if (a) {
            this._angle = a;
        }
    }

}


let
    debug = 0,
    slideDeck = false,

    /**
     * @param  arr is an array of all slides
     * @return an array with n Slide objects
     */
    discoverDepths = function(arr) {
        return arr.map((x) => {
            if (x.trim().length > 0) {
                let countHashes = /^#+/g,
                    match = x.match(countHashes);
                return new Slide(x, match ? match[0].length : 0);
            }
        });
    },


    /**
     * @param  arr is an array of all slides containing id, depth and content
     *
     * @return the array with additional parent property created.
     */
    establishParentage = function(content) {

        for (let i = content.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (debug > 2) {
                  console.log("Comparing ", content[j].id, content[j].depth, "with", content[i].id, content[i].depth, content[j].depth < content[i].depth);
                }
                if (content[j].depth < content[i].depth) {
                    // we have found its parent, so record it
                    if (debug > 1) {
                      console.log("Aha!", content[j].id, content[j].depth, "with", content[i].id, content[i].depth);
                    }
                    content[i].parent = content[j];
                    break; // and move on with the next unparented entry
                }
            }
        }
        return content;
    },

    // the slide radius is known, so for n slides at h1 an imaginary circle
    // is needed around which to arrange the slides. The circumference of the
    // imaginary circle is approximately n x the slide radius so the imaginary
    // radius is that divided by 2π

    innerCircleRadius = (count) => {
        let imaginaryCircumference = count * (slideRadius * 2);
        let imaginaryRadius = imaginaryCircumference / TAU;
        return imaginaryRadius;
    },

    positionOneCentralSlide = (content) => {
        var slide = content.filter((slide) => slide.depth == 1);
        if (slide.length > 1) {
            console.error("Bad Slide!  NO BISCUIT!");
        }
        slide.angle = 2 * TAU;
        slide.scale = deepest;
        console.log("Single central slide", slide.scale);
    },

    positionMultipleCentralSlides = (content) => {
        let angle = 3.5 * Math.PI;
        let slides = content.filter((slide) => slide.depth == 1);
        let radius = innerCircleRadius(slides.length);
        let stepSize = TAU / slides.length;
        slides.forEach((slide) => {
            slide.angle = angle;
            slide.scale = 10;
            angle -= stepSize;
        });
    },

    insertInnerCircle = (ccc) => {
        // how many top level entries are there?
        if (ccc.filter((x) => x.depth == 1).length == 1) {
            positionOneCentralSlide(ccc);
        } else {
            positionMultipleCentralSlides(ccc);
        }
    },

    populateBranches = (slides) => {
        // work through all the slides, top to bottom
        slides.forEach((slide) => {
            // for each slide that is positioned...
            // its children
            let children = slides.filter((s) => s.parent == slide);
            if (children) {
                let angleStep, angle, childScale, childRadius;
                childRadius = slide.radius * shrinkFactor;
                childScale = slide.scale * shrinkFactor;
                angle = slide.angle;
                if (children.length > 1) {
                    // multiple children need more angular calculation
                    angleStep = TAU / ( slide.depth + children.length);
                    angle = slide.angle + (((children.length - 1) * angleStep) / 2);
                }
                // arrange them either side of the 'direction' angle
                children.forEach((child) => {
                    // naive resize for now.
                    child.scale = childScale;
                    child.angle = angle;
                    child.radius = childRadius;
                    angle -= angleStep;
                });
            }
        });
        // resize them if that's appropriate
        // arrange them either side of the 'direction' angle
    },

    prepMeta = (content) => {
        return content.map((slide) => {

            if (debug > 1) console.log("preparing meta ", slide.raw);

            let data = [];
            data.push(["x", slide.x]);
            data.push(["y", slide.y]);
            data.push(["z", 0]);
            data.push(["hue", slide.hue]);
            if (slide.scale) {
                data.push(["scale", slide.scale]);
            }

            slide.meta = data.map(
                (meta) => `data-${meta[0]}=${meta[1]}`
            ).join(' ');

            slide.meta += ` style="background: ${slide.hue}" `;

            if (debug > 2) console.log(slide.meta);

        });
    },


    fitSlides = (slides) => {
        // *dumb* jiggling loop over the slide deck nnn times
        // compare every slide with every other slide to check
        // for overlap, and if there is an overlap move the slides
        // at random
        console.log("fitting");
        let a, b, c, xdiff, ydiff, distance, seeda = 271172,
            seedb = 221175,
            seedc = 12345;

        let moves=0;
        let leaves=0;

        let combinedRadii = 0;
        for (let h = nnn; h > 0; h--) {

            for (let i = slides.length-1; i >= 0; i--) {

                a = slides[i];
                a.canMove = true;

                for (let j = slides.length-1 ; j >= 0; j--) {

                    b = slides[j];
                    if (a===b) {
                      continue;
                    }
                    combinedRadii = (a.radius + b.radius)/2;

                    xdiff = Math.abs(a.x - b.x);
                    ydiff = Math.abs(a.y - b.y);
                    distance = Math.sqrt(xdiff*xdiff+ydiff*ydiff);

                    if (distance === 0 && debug>1) {
                      console.log(`Slides ${a.id} and ${b.id} have zero distance...???`);
                    }

                    if (distance < combinedRadii) {
                        a.canMove = false;
                    }

                }

                if (a.canMove) {
                  a.reduceOffset();
                  moves++;
                } else {
                  leaves++;
//                  a.increaseOffset();
                }

            }
        }
        if (debug>0) {
          console.log("During fitting there were", moves, "node moves.");
        }
    };




module.exports = {

    splitter: /^(#+.*)$/mg,
    keepSplitterMatch: true,

    overview: function() {

        if (slideDeck) {

            let xdiff,
                ydiff,
                i = {
                    x: {
                        max: 0,
                        min: 0
                    },
                    y: {
                        max: 0,
                        min: 0
                    },
                    xy: {}
                };

            slideDeck.forEach((slide) => {
                i.x.max = Math.max(slide.x, i.x.max);
                i.x.min = Math.min(slide.x, i.x.min);
                i.y.max = Math.max(slide.y, i.y.max);
                i.y.min = Math.min(slide.y, i.y.min);
            });

            i.x.middle = i.x.max + i.x.min;
            i.y.middle = i.y.max + i.y.min;
            i.x.max = Math.max(Math.abs(i.x.max), Math.abs(i.x.min));
            i.y.max = Math.max(Math.abs(i.y.max), Math.abs(i.y.min));
            i.xy.max = Math.max(i.x.max, i.y.max)*2;

            // find the largest and smallest x and y values
            // that are reffered to by slides.
            return `<div id="overview" class="step step-overview"
            data-x=${i.x.middle}
            data-y=${i.y.middle/2}
            data-z=${i.xy.max}>
            </div>`;
        }

    },

    layout: (content, debugLevel) => {
        debug = debugLevel;

        slideDeck = discoverDepths(content);
        slideDeck = slideDeck.filter((x) => x); // remove undefined's
        slideDeck = slideDeck.filter((x) => x); // remove undefined's
        deepest = slideDeck.reduce((a,b)=>a.depth>b.depth?a:b).depth;
        establishParentage(slideDeck);
        insertInnerCircle(slideDeck);
        populateBranches(slideDeck);
        fitSlides(slideDeck);
        prepMeta(slideDeck);

        return slideDeck;
    },
};
