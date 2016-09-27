"use strict";

let reported = '';

let reportElem = (e) => {
  if (e.dataset && e.dataset.x) {
    if (reported != e.dataset) {
      console.log(e.dataset);
    }
    reported = e.dataset.meta;
  } else {
    if (e.parent) {
      reportElem(e.parent);
    } else {
      console.log("meh");
    }
  }
};


let reportSlide = (e) => {
  reportElem(e.target);
};

let prep = () => {
  document.addEventListener('mouseenter', reportSlide, true);
};

window.addEventListener("load", prep);
