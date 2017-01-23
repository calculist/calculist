var _ = require('lodash');

var animationFrame, isRefeshing, requestAnimationFrame;

try { requestAnimationFrame = window.requestAnimationFrame; } catch (e) {}
requestAnimationFrame || (requestAnimationFrame = function (cb) { _.defer(cb, _.now()); });

var refreshAnimationFrame = function () {
  if (isRefeshing) return;
  isRefeshing = true;
  requestAnimationFrame(function (af) {
    animationFrame = af;
    isRefeshing = false;
  });
};

refreshAnimationFrame();

module.exports = function () {
  refreshAnimationFrame();
  return animationFrame;
};
