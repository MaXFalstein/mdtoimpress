"use strict";

let overviewSlideName = "overview";
let lastSlide = '';
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

let keyCheck = (e) => {
  console.log(e.key);
  if (e.key == "o") {
    var hash = window.location.hash.substr(1);
    if (hash == "/"+overviewSlideName) {
      if (lastSlide !== '') {
        impress().goto(
          document.getElementById(lastSlide.replace("/", ""))
        );
      }
    } else {
      lastSlide = hash;
      impress().goto(
        document.getElementById(overviewSlideName)
      );      
    }
    e.stopPropagation();
  }
  reportElem(e.target);
};

let reportSlide = (e) => {
  reportElem(e.target);
};

let prep = () => {
  document.addEventListener('mouseenter', reportSlide, true);
  document.addEventListener('keypress', keyCheck, true);

};

window.addEventListener("load", prep);
