"use strict";

// starting position and horizontal step size (assumes slide is 1000x700 )
var xpos = 0, xstep = 1200;

module.exports = {

    /**
     * A regular expression used by this layout engine to identify where one
     * slide ends and another begins.
     */
    splitter: /^(#+.*)$/mg,

    /**
     * Set to true of the content found by the splitter regex should be allowed
     * to remain in the slide or false if it should be removed
     *
     * e.g. using six dashes ------ to deliniate slides will appear as a
     * horizontal rule at the top of the slide after the markdown engine has
     * processed it, so to keep such errant lines out, set keepSplitterMatch to
     * false (assuming your regex looks like this: /(?:^-{6,}$)/mg
     *
     * Conversely if you sish to split on every heading thus /^(#+.*)$/mg, and
     * use the heading as your splitter, then you probably want to set
     * keepSplitterMatch to true so that the heading remains in the slide.
     */
    keepSplitterMatch: true,

    /**
     * @param content is an array of slides that are
     *        to be presented, in markdown format.
     *
     * @return an array of objects, one per slide.  Each object has two
     *         properties, `content` which is the markdown content of the
     *         slide, and `meta` which is the layout infomration
     */
    layout: (content) => content.map(
        (c) => {
            return {
                content: c,
                meta: ` data-x=${xpos+=xstep} `
            };
        }
    )
};
