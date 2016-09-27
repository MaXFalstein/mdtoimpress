"use strict";



// constants
const
    overallLoop = 80, // jiggling multiplier
    shrinkAndGrowStepCount = 80, // jiggling number
    width = 1000,
    height = 700,
    slideRadius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2,
    slideOffset = slideRadius *2 ,
    TAU = 2 * Math.PI,
    RAD = 57.3,
    shift = 100000, // for overlap simplicity
    shrinkFactor = 0.6,
    colourByDepth = true,
    opac=0.5,
    colourByDepthColours = [
        `rgba(178,41,55, ${opac})`,
        `rgba(222,80,3, ${opac})`,
        `rgba(230,170,25, ${opac})`,
        `rgba(255,221,0, ${opac})`,
        `rgba(128,200,55, ${opac})`,
        `rgba(34,139,34, ${opac})`,
        "#20B2AA",
        "#60B6CA",
        "#7F91C3",
        "#575597"
    ];



// global variables
let
    deepest = 0,
    sid = 0;


//classes (one of)
class Slide {
    constructor(content, depth) {
        this._id = ++sid; // auto incrementing slide id
        this._angle = Math.PI;
        this.parent = 0; // there is no slide 0 - i.e. default false parent
        this.children = []; // there is no slide 0 - i.e. default false parent
        this.content = content;
        this.depth = depth;
        this.scale = 1;
        this._offset = slideOffset; // a large gap between slides before its reduced by the fitting routine.
        this._adjustments = 0;
        this._overlap = false;
        this.shrinks = 0;
        this.grows=0;
    }

    get liveDepth() {
        return (this.parent ? this.parent.depth : 0) + 1;
    }

    get hue() {
        if (colourByDepth) {
            return colourByDepthColours[this.depth];
        } else {
            return `hsl(${this.overallAngle},${(this.depth-1)/deepest*100}%,75%)`;
        }

    }

    get depthColor() {
        return colourByDepthColours[this.depth];
    }


    get overallAngle() {
        // TODO final multiplier is a hack.  should be radians or similar
        return (this.parent ? this.parent.overallAngle : 0) + (this.angle * 20);
    }

    get meta() {

        let data = [];
        data.push(["x", this.x]);
        data.push(["y", this.y]);
        data.push(["z", 0]);
        data.push(["id", this.id]);
        data.push(["hue", this.hue]);
        data.push(["scale", this.scale]);
        data.push(["adj", this._adjustments]);
        data.push(["offset", this._offset]);
        data.push(["radius", this._radius]);
        data.push(["transition-duration", "5000"]);
        data.push(["transitionDuration", "10000"]);

        let result = data.map(
            (meta) => `data-${meta[0]}=${meta[1]}`
        ).join(' ');

        result += ` style="background: ${this.hue}; border-color: ${this.depthColor}"; box-shadow: 0 0 2em 2em ${this.depthColor} `;
        return result;
    }

    get x() {
        return (this.parent ? this.parent.x : 0) + this.offset * Math.sin(this.angle);
    }

    get y() {
        return (this.parent ? this.parent.y : 0) + this.offset * Math.cos(this.angle);
    }

    get x1() {
      return Math.floor(this.x - (0.5 * width * this.scale));
    }

    get y1() {
      return Math.floor(this.y - (0.5 * height * this.scale));
    }

    get x2() {
      return Math.floor(this.x + (0.5 * width * this.scale));
    }

    get y2() {
      return Math.floor(this.y + (0.5 * height * this.scale));
    }


    /* return true if rectangle soverlap, e.g. these should... */
    overlaps(other) {
        return (this.id !== other.id) &&
                (this.x1+shift < other.x2+shift) &&
                (this.x2+shift > other.x1+shift) &&
                (this.y1+shift < other.y2+shift) &&
                (this.y2+shift > other.y1+shift);
    }

    get id() {
        return this._id;
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

    reduceOffset(offsetReduction) {
        //console.log(`Reducing ${this.id} offset of ${this.offset} by ${offsetReduction}`);
        if (this._offset > offsetReduction) {
            this._offset -= offsetReduction;
        } else {
          console.log("Offset at min limit.");
        }
        this.shrinks++;
    }

    increaseOffset(amount) {
        this._offset += amount;
        this.grows++;
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


    get overlap() {
        return this._overlap;
    }


    set overlap(o) {
        this._overlap = o;
    }


}


let
    debug = 0,
    slideDeck = false,

    /**
     * @param  arr is an array of all slides
     * @return an array with n Slide objects
     */
    createSlideObjects = function(arr) {
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
    establishHierarchy = function(slides) {
      let i,j, parentNeeded;
      for (i = slides.length - 1; i >= 0; i--) {
        j=i-1;
        parentNeeded = true;
        while (j>=0 && parentNeeded) {
          if (slides[j].depth < slides[i].depth) {
            parentNeeded = false;
            slides[i].parent = slides[j];
            slides[j].children.push(slides[i]);
          }
          j--;
        }
      }
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
            slide.scale = 1;
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
                    angleStep = TAU / (slide.depth + children.length) / 2;
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


    shrinkUntilOverlapping = (slides) => {

        for (let i = 0; i < shrinkAndGrowStepCount; i++) {
            let offsetReduction = shrinkAndGrowStepCount - i;
            // reset the overlap
            slides.forEach((a) => a.overlap = false);

            // look for overlaps
            slides.forEach((a) => {
                slides.forEach((b) => {
                    let overlaps = a.overlaps(b);
                    if (a != b) {
                        if (overlaps) {
                            if (a.depth > b.depth) {
                                a.overlap = true;
                            } else {
                                if (b.depth < a.depth) {
                                    b.overlap = true;
                                } else {
                                    a.overlap = true;
                                    b.overlap = true;
                                }
                            }
                        }
                    }
                });
            });

            // move any slides that don't overlap
            for (let i = slides.length - 1; i >= 0; i--) {
                if (slides[i].overlap) {
                    // do nothing on overlap
                } else {
                    slides[i].reduceOffset(offsetReduction);
                }
            }


        }

    },



    growUntilNotOverlapping = (slides) => {

        // look for overlaps
        for (let i = 0; i < (shrinkAndGrowStepCount); i++) {
            // reset the overlap
            slides.forEach((a) => a.overlap = false);

            slides.forEach((a) => {
                slides.forEach((b) => {
                    //console.log("do grow", i);
                    let overlaps = a.overlaps(b);
                    if (a !== b) {
                        if (overlaps) {
                            console.log("OL", a.id, b.id);
                            if (a.depth > b.depth) {
                                a.overlap = true;
                            } else {
                                b.overlap = true;
                            }
                        }
                    }
                });
            });

            var lapped = 0;
            // move any slides that don't overlap
            for (let j = slides.length - 1; j >= 0; j--) {
                let offsetReduction = shrinkAndGrowStepCount-i+j;

                if (slides[j].overlap) {
                    console.log("Slide",j,slides[j].depth," offset now ", slides[j].offset);
                    slides[j].increaseOffset(offsetReduction);
                    lapped++;
                }
            }


        }


    },

    injectDebugContent = (slides) => {

      slides.map((slide) => {
        let
          overlapsReport = [],
          childIDs = [];

        slides.map ((x) => {
          if (x.overlaps(slide)) {
            overlapsReport.push(x.id);
          }
        });

        slide.children.map((x) => {
          childIDs.push(x.id);
        });


          slide.content = `
<h1>Slide ${slide.id}</h1>
<p>x<super>0</super> ${Math.floor(slide.x)} y<super>0</super> ${Math.floor(slide.y)} (middle)</p>
<p>x<super>1</super>${slide.x1} y<super>1</super>${slide.y1} (topleft)</p>
<p>x<super>2</super>${slide.x2} y<super>2</super>${slide.y2} (bottomright)</p>
<p>w${width*slide.scale} h${height*slide.scale} (scale ${slide.scale})</p>
<p>parent ${slide.parent.id} (depth ${slide.depth})</p>
<p>children (${slide.children.length}) ${childIDs.join(",")}</p>
<p>overlaps ${overlapsReport.join(",")}</p>
<p>shrinks ${slide.shrinks} grows ${slide.grows}</p>
`;
        });
    },

    fitSlides = (slides) => {
        let a, b, i, j;
        let l = slides.length - 1;

        for (let xxxx = 0; xxxx < overallLoop; xxxx++) {
            shrinkUntilOverlapping(slides);
            growUntilNotOverlapping(slides);
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
            i.xy.max = Math.max(i.x.max, i.y.max) * 2;

            // find the largest and smallest x and y values
            // that are reffered to by slides.
            return `<div id="overview" class="step step-overview"
            data-x=${i.x.middle/2}
            data-y=${i.y.middle/2}
            data-z=${i.xy.max}>
            </div>`;
        }

    },

    layout: (content, debugLevel) => {
        debug = debugLevel;

        slideDeck = createSlideObjects(content);
        // remove undefined's
        slideDeck = slideDeck.filter((x) => x);
        deepest = slideDeck.reduce((a, b) => a.depth > b.depth ? a : b).depth;
        establishHierarchy(slideDeck);
        insertInnerCircle(slideDeck);
        populateBranches(slideDeck);
        fitSlides(slideDeck);
        // injectDebugContent(slideDeck);

        return slideDeck;
    },
};
