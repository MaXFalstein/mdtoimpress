"use strict";

const TAU = 2 * Math.PI;
const maxAngle = TAU / 3; // one third of a circle.
const slideRadius = Math.sqrt((1000 * 1000) + (700 * 700));
const slideGapDefault = 5 * slideRadius * 1.6;
const nnn = 10000; // jiggling number - how many times do we move each slide to ensure a compact layout?


let
    primes = {
        next: 0,
        seed: 999983 * 2 + 1,
        all: [17, 31, 617, 1223, 1223, 1223, 617, 37, 17, 13, 1997, 3121, 3469]
    },
    sid = 0,

    colour = (deg) => {
        deg = deg || 0;
        primes.seed += primes.all[primes.next];
        primes.next = (primes.next + 1) % 10;

        return `hsl(${primes.seed % 360 + deg},100%,50%)`;
    };


class Slide {
    constructor(content, depth) {
        this._id = ++sid; // auto incrementing slide id
        this._gap = slideGapDefault;
        this._angle = Math.PI;
        this.parent = 0; // there is no slide 0 - i.e. default false parent
        this.content = content;
        this.depth = depth;
    }

    get hue() {
        return colour(this.angle);
    }

    get id() {
        return this._id;
    }

    get xx() {
        return (this.parent && this.parent.xx ? this.parent.xx : 0) + this.gap * Math.sin(this.angle);
    }

    get yy() {
        return (this.parent && this.parent.yy ? this.parent.yy : 0) + this.gap * Math.cos(this.angle);
    }

    get raw() {
        if (this.parent) {
            return `s${this.id} p${this.parent.id} g${this.gap} c${this.content.slice(0,6)} angle${this.angle}`;
        } else {
            return `s${this.id} TOP angle${this.angle}`;
        }
    }

    get gap() {
        return this._gap;
    }
    set gap(g) {
        if (g) {
            this._gap = g;
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
                if (debug > 2) console.log("Comparing ", content[j].id, content[j].depth, "with", content[i].id, content[i].depth, content[j].depth < content[i].depth);
                if (content[j].depth < content[i].depth) {
                    // we have found its parent, so record it
                    if (debug > 1) console.log("Aha!", content[j].id, content[j].depth, "with", content[i].id, content[i].depth);
                    content[i].parent = content[j];
                    // and move on with the next unparented entry
                    break;
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
        slide.scale = 10;
        console.log("Single central slide", slide.scale);
    },

    positionMultipleCentralSlides = (content) => {
        let angle = 3.5 * Math.PI;
        let slides = content.filter((slide) => slide.depth == 1);
        let radius = 5 * innerCircleRadius(slides.length);
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
                let angleStep, angle, childScale, childGap;
                if (children.length == 1) {
                    // a single child uses the same angle as it's parent
                    angle = slide.angle;
                } else {
                    childScale = slide.scale * 0.25;
                    childGap = (this.gap ? this.gap * 0.9 : slideGapDefault);
                    let bestAngleStep = Math.pow(childGap, 2) / (2 * childGap * slideRadius);
                    let simpleAngleStep = maxAngle / (children.length - 1);

                    angleStep = Math.min(bestAngleStep, simpleAngleStep);
                    angle = slide.angle + (((children.length - 1) * angleStep) / 2);
                }
                // arrange them either side of the 'direction' angle
                children.forEach((child) => {
                    // naive resize for now.
                    child.scale = childScale;
                    child.angle = angle;
                    child.gap = childGap;
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
            data.push(["x", slide.xx]);
            data.push(["y", slide.yy]);
            data.push(["z", 0]);
            data.push(["hue", slide.hue]);
            if (slide.scale) {
                console.log("Scale is", slide.scale);
                data.push(["scale", slide.scale * 1000]);
            } else {
                console.log("NO SCALE", slide.scale);
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

        for (let h = nnn; h > 0; h--) {

            slides.map((s) => {
                if (s.canMove) {
                    s.gap = Math.abs(s.gap - 10);
                }
                s.canMove = true;
            });

            for (let i = slides.length - 1; i >= 0; i--) {
                for (let j = i - 1; j >= 0; j--) {
                    a = slides[i];
                    b = slides[j];
                    xdiff = Math.pow(a.xx - b.xx, 2);
                    ydiff = Math.pow(a.yy - b.yy, 2);
                    distance = Math.sqrt(xdiff + ydiff);

                    if (distance < slideRadius * 1.6) {
                        a.canMove = false;
                    }
                }
            }
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
                    }
                };

            slideDeck.forEach((slide) => {
                i.x.max = Math.max(slide.xx, i.x.max);
                i.x.min = Math.max(slide.xx, i.x.min);
                i.y.max = Math.max(slide.yy, i.y.max);
                i.y.min = Math.max(slide.yy, i.y.min);
            });

            xdiff = Math.abs(i.x.min) + i.x.max;
            ydiff = Math.abs(i.y.min) + i.y.max;

            let deepest = Math.sqrt(xdiff * xdiff + ydiff * ydiff) / 3 * 4;

            // find the largest and smallest x and y values
            // that are reffered to by slides.
            return `<div id="overview" class="step step-overview" data-z=${deepest}></div>`;
        }

    },

    layout: (content, debugLevel) => {
        debug = debugLevel;

        slideDeck = discoverDepths(content);
        slideDeck = slideDeck.filter((x) => x); // remove undefined's
        establishParentage(slideDeck);
        insertInnerCircle(slideDeck);
        populateBranches(slideDeck);
        fitSlides(slideDeck);
        prepMeta(slideDeck);

        return slideDeck;
    },
};
