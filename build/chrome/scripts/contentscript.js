(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _ext = require("./utils/ext");

var _ext2 = _interopRequireDefault(_ext);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var extractTags = function extractTags() {
  var url = document.location.href;
  if (!url || !url.match(/^http/)) return;

  var data = {
    title: "",
    description: "",
    url: document.location.href
  };

  var ogTitle = document.querySelector("meta[property='og:title']");
  if (ogTitle) {
    data.title = ogTitle.getAttribute("content");
  } else {
    data.title = document.title;
  }

  var descriptionTag = document.querySelector("meta[property='og:description']") || document.querySelector("meta[name='description']");
  if (descriptionTag) {
    data.description = descriptionTag.getAttribute("content");
  }

  return data;
};

function onRequest(request, sender, sendResponse) {
  if (request.action === 'process-page') {
    sendResponse(extractTags());
  }
}

_ext2.default.runtime.onMessage.addListener(onRequest);

},{"./utils/ext":2}],2:[function(require,module,exports){
'use strict';

var apis = ['alarms', 'bookmarks', 'browserAction', 'commands', 'contextMenus', 'cookies', 'downloads', 'events', 'extension', 'extensionTypes', 'history', 'i18n', 'idle', 'notifications', 'pageAction', 'runtime', 'storage', 'tabs', 'webNavigation', 'webRequest', 'windows'];

function Extension() {
  var _this = this;

  apis.forEach(function (api) {

    _this[api] = null;

    try {
      if (chrome[api]) {
        _this[api] = chrome[api];
      }
    } catch (e) {}

    try {
      if (window[api]) {
        _this[api] = window[api];
      }
    } catch (e) {}

    try {
      if (browser[api]) {
        _this[api] = browser[api];
      }
    } catch (e) {}
    try {
      _this.api = browser.extension[api];
    } catch (e) {}
  });

  try {
    if (browser && browser.runtime) {
      this.runtime = browser.runtime;
    }
  } catch (e) {}

  try {
    if (browser && browser.browserAction) {
      this.browserAction = browser.browserAction;
    }
  } catch (e) {}
}

module.exports = new Extension();

},{}]},{},[1])

//# sourceMappingURL=contentscript.js.map
