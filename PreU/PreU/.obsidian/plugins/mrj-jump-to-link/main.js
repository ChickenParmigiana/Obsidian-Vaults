'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

var Settings = /** @class */ (function () {
    function Settings() {
        this.mode = 'popovers';
    }
    return Settings;
}());

var JumpToLink = /** @class */ (function (_super) {
    __extends(JumpToLink, _super);
    function JumpToLink() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isLinkHintActive = false;
        _this.prefixInfo = undefined;
        _this.handleJumpToLink = function () {
            if (_this.isLinkHintActive) {
                return;
            }
            var currentView = _this.app.workspace.activeLeaf.view;
            if (currentView.getState().mode === 'preview') {
                var previewViewEl = currentView.previewMode.containerEl.querySelector('div.markdown-preview-view');
                _this.managePreviewLinkHints(previewViewEl);
            }
            else if (currentView.getState().mode === 'source') {
                var cmEditor = currentView.sourceMode.cmEditor;
                _this.manageSourceLinkHints(cmEditor);
            }
        };
        _this.managePreviewLinkHints = function (previewViewEl) {
            var linkHints = _this.getPreviewLinkHints(previewViewEl);
            if (linkHints.length) {
                if (_this.settings.mode === 'modal') {
                    _this.displayModal(linkHints);
                }
                else if (_this.settings.mode === 'popovers') {
                    _this.displayPreviewPopovers(previewViewEl, linkHints);
                }
                _this.activateLinkHints(linkHints);
            }
        };
        _this.manageSourceLinkHints = function (cmEditor) {
            var linkHints = _this.getSourceLinkHints(cmEditor);
            if (linkHints.length) {
                if (_this.settings.mode === 'modal') {
                    _this.displayModal(linkHints);
                }
                else if (_this.settings.mode === 'popovers') {
                    _this.displaySourcePopovers(cmEditor, linkHints);
                }
                _this.activateLinkHints(linkHints);
            }
        };
        _this.activateLinkHints = function (linkHints) {
            var linkHintMap = {};
            linkHints.forEach(function (x) { return linkHintMap[x.letter] = x; });
            var handleHotkey = function (newLeaf, link) {
                if (link.type === 'internal') {
                    // not sure why the second argument in openLinkText is necessary.
                    _this.app.workspace.openLinkText(decodeURI(link.linkText), '', newLeaf, { active: true });
                }
                else if (link.type === 'external') {
                    // todo
                    require('electron').shell.openExternal(link.linkText);
                }
            };
            var removePopovers = function () {
                document.removeEventListener('click', removePopovers);
                document.querySelectorAll('.jl.popover').forEach(function (e) { return e.remove(); });
                document.querySelectorAll('#jl-modal').forEach(function (e) { return e.remove(); });
                _this.prefixInfo = undefined;
                _this.isLinkHintActive = false;
            };
            var handleKeyDown = function (event) {
                var _a;
                if (event.key === 'Shift') {
                    return;
                }
                var eventKey = event.key.toUpperCase();
                var prefixes = new Set(Object.keys(linkHintMap).filter(function (x) { return x.length > 1; }).map(function (x) { return x[0]; }));
                var linkHint;
                if (_this.prefixInfo) {
                    linkHint = linkHintMap[_this.prefixInfo.prefix + eventKey];
                }
                else {
                    linkHint = linkHintMap[eventKey];
                    if (!linkHint && prefixes && prefixes.has(eventKey)) {
                        _this.prefixInfo = { prefix: eventKey, shiftKey: event.shiftKey };
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        return;
                    }
                }
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                var newLeaf = ((_a = _this.prefixInfo) === null || _a === void 0 ? void 0 : _a.shiftKey) || event.shiftKey;
                linkHint && handleHotkey(newLeaf, linkHint);
                document.removeEventListener('keydown', handleKeyDown);
                removePopovers();
            };
            document.addEventListener('click', removePopovers);
            document.addEventListener('keydown', handleKeyDown);
            _this.isLinkHintActive = true;
        };
        _this.getPreviewLinkHints = function (previewViewEl) {
            var anchorEls = previewViewEl.querySelectorAll('a');
            var embedEls = previewViewEl.querySelectorAll('.internal-embed');
            var linkHints = [];
            anchorEls.forEach(function (anchorEl, i) {
                var linkType = anchorEl.hasClass('internal-link')
                    ? 'internal'
                    : 'external';
                var linkText = linkType === 'internal'
                    ? anchorEl.dataset['href']
                    : anchorEl.href;
                var offsetParent = anchorEl.offsetParent;
                var top = anchorEl.offsetTop;
                var left = anchorEl.offsetLeft;
                while (offsetParent) {
                    if (offsetParent == previewViewEl) {
                        offsetParent = undefined;
                    }
                    else {
                        top += offsetParent.offsetTop;
                        left += offsetParent.offsetLeft;
                        offsetParent = offsetParent.offsetParent;
                    }
                }
                linkHints.push({
                    letter: '',
                    linkText: linkText,
                    type: linkType,
                    top: top,
                    left: left,
                });
            });
            embedEls.forEach(function (embedEl, i) {
                var linkText = embedEl.getAttribute('src');
                var linkEl = embedEl.querySelector('.markdown-embed-link');
                if (linkText && linkEl) {
                    var offsetParent = linkEl.offsetParent;
                    var top_1 = linkEl.offsetTop;
                    var left = linkEl.offsetLeft;
                    while (offsetParent) {
                        if (offsetParent == previewViewEl) {
                            offsetParent = undefined;
                        }
                        else {
                            top_1 += offsetParent.offsetTop;
                            left += offsetParent.offsetLeft;
                            offsetParent = offsetParent.offsetParent;
                        }
                    }
                    linkHints.push({
                        letter: '',
                        linkText: linkText,
                        type: 'internal',
                        top: top_1,
                        left: left,
                    });
                }
            });
            var sortedLinkHints = linkHints.sort(function (a, b) {
                if (a.top > b.top) {
                    return 1;
                }
                else if (a.top === b.top) {
                    if (a.left > b.left) {
                        return 1;
                    }
                    else if (a.left === b.left) {
                        return 0;
                    }
                    else {
                        return -1;
                    }
                }
                else {
                    return -1;
                }
            });
            var linkHintLetters = _this.getLinkHintLetters(sortedLinkHints.length);
            sortedLinkHints.forEach(function (linkHint, i) {
                linkHint.letter = linkHintLetters[i];
            });
            return sortedLinkHints;
        };
        _this.getSourceLinkHints = function (cmEditor) {
            // expecting either [[Link]] or [[Link|Title]]
            var regExInternal = /\[\[(.+?)(\|.+?)?\]\]/g;
            // expecting [Title](../example.md)
            var regExMdInternal = /\[.+?\]\(((\.\.|\w|\d).+?)\)/g;
            // expecting [Title](file://link) or [Title](https://link)
            var regExExternal = /\[.+?\]\(((https?:|file:).+?)\)/g;
            // expecting http://hogehoge or https://hogehoge
            var regExUrl = /(?<= |\n|^)(https?:\/\/[^ \n]+)/g;
            var strs = cmEditor.getValue();
            var linksWithIndex = [];
            var regExResult;
            while (regExResult = regExInternal.exec(strs)) {
                var linkText = regExResult[1];
                linksWithIndex.push({ index: regExResult.index, type: 'internal', linkText: linkText });
            }
            while (regExResult = regExMdInternal.exec(strs)) {
                var linkText = regExResult[1];
                linksWithIndex.push({ index: regExResult.index, type: 'internal', linkText: linkText });
            }
            while (regExResult = regExExternal.exec(strs)) {
                var linkText = regExResult[1];
                linksWithIndex.push({ index: regExResult.index, type: 'external', linkText: linkText });
            }
            while (regExResult = regExUrl.exec(strs)) {
                var linkText = regExResult[1];
                linksWithIndex.push({ index: regExResult.index, type: 'external', linkText: linkText });
            }
            var linkHintLetters = _this.getLinkHintLetters(linksWithIndex.length);
            var linksWithLetter = [];
            linksWithIndex
                .sort(function (x, y) { return x.index - y.index; })
                .forEach(function (linkHint, i) {
                linksWithLetter.push(__assign({ letter: linkHintLetters[i] }, linkHint));
            });
            return linksWithLetter;
        };
        _this.getLinkHintLetters = function (numLinkHints) {
            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var prefixCount = Math.ceil((numLinkHints - alphabet.length) / (alphabet.length - 1));
            // ensure 0 <= prefixCount <= alphabet.length
            prefixCount = Math.max(prefixCount, 0);
            prefixCount = Math.min(prefixCount, alphabet.length);
            var prefixes = __spreadArray([''], Array.from(alphabet.slice(0, prefixCount)));
            var linkHintLetters = [];
            for (var i = 0; i < prefixes.length; i++) {
                var prefix = prefixes[i];
                for (var j = 0; j < alphabet.length; j++) {
                    if (linkHintLetters.length < numLinkHints) {
                        var letter = alphabet[j];
                        if (prefix === '') {
                            if (!prefixes.includes(letter)) {
                                linkHintLetters.push(letter);
                            }
                        }
                        else {
                            linkHintLetters.push(prefix + letter);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return linkHintLetters;
        };
        _this.displayModal = function (linkHints) {
            var modalEl = document.createElement('div');
            modalEl.innerHTML = "\n\t\t\t<div class=\"modal-container\" id=\"jl-modal\">\n\t\t\t\t<div class=\"modal-bg\"></div>\n\t\t\t\t<div class=\"modal\">\n\t\t\t\t\t<div class=\"modal-close-button\"></div>\n\t\t\t\t\t<div class=\"modal-title\">Jump to links</div>\n\t\t\t\t\t<div class=\"modal-content\"></div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t";
            modalEl.querySelector('.modal-close-button').addEventListener('click', modalEl.remove);
            document.body.appendChild(modalEl);
            var linkEl = function (content) {
                var el = document.createElement('div');
                el.innerHTML = content;
                return el;
            };
            var modalContentEl = modalEl.querySelector('.modal-content');
            linkHints.forEach(function (linkHint) {
                return modalContentEl.appendChild(linkEl(linkHint.letter + ' ' + linkHint.linkText));
            });
        };
        _this.displayPreviewPopovers = function (markdownPreviewViewEl, linkHints) {
            for (var _i = 0, linkHints_1 = linkHints; _i < linkHints_1.length; _i++) {
                var linkHint = linkHints_1[_i];
                var linkHintEl = markdownPreviewViewEl.createEl('div');
                linkHintEl.style.top = linkHint.top + 'px';
                linkHintEl.style.left = linkHint.left + 'px';
                linkHintEl.textContent = linkHint.letter;
                linkHintEl.addClass('jl');
                linkHintEl.addClass('popover');
            }
        };
        _this.displaySourcePopovers = function (cmEditor, linkKeyMap) {
            var createWidgetElement = function (content) {
                var linkHintEl = document.createElement('div');
                linkHintEl.addClass('jl');
                linkHintEl.addClass('popover');
                linkHintEl.innerHTML = content;
                return linkHintEl;
            };
            var drawWidget = function (cmEditor, linkHint) {
                var pos = cmEditor.posFromIndex(linkHint.index);
                // the fourth parameter is undocumented. it specifies where the widget should be place
                return cmEditor.addWidget(pos, createWidgetElement(linkHint.letter), false, 'over');
            };
            linkKeyMap.forEach(function (x) { return drawWidget(cmEditor, x); });
        };
        return _this;
    }
    JumpToLink.prototype.onload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.loadData()];
                    case 1:
                        _a.settings = (_b.sent()) || new Settings();
                        this.addSettingTab(new SettingTab(this.app, this));
                        this.addCommand({
                            id: 'activate-jump-to-link',
                            name: 'Jump to Link',
                            callback: this.handleJumpToLink,
                            hotkeys: [{ modifiers: ['Ctrl'], key: '\'' }]
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    JumpToLink.prototype.onunload = function () {
        console.log('unloading jump to links plugin');
    };
    return JumpToLink;
}(obsidian.Plugin));
var SettingTab = /** @class */ (function (_super) {
    __extends(SettingTab, _super);
    function SettingTab(app, plugin) {
        var _this = _super.call(this, app, plugin) || this;
        _this.plugin = plugin;
        return _this;
    }
    SettingTab.prototype.display = function () {
        var _this = this;
        var containerEl = this.containerEl;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Jump To Link.' });
        new obsidian.Setting(containerEl)
            .setName('Presentation')
            .setDesc('How to show links')
            .addDropdown(function (cb) {
            cb
                .addOptions({
                "popovers": 'Popovers',
                "modal": 'Modal'
            })
                .setValue(_this.plugin.settings.mode)
                .onChange(function (value) {
                _this.plugin.settings.mode = value;
                _this.plugin.saveData(_this.plugin.settings);
            });
        });
    };
    return SettingTab;
}(obsidian.PluginSettingTab));

module.exports = JumpToLink;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInR5cGVzLnRzIiwibWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gZnJvbS5sZW5ndGgsIGogPSB0by5sZW5ndGg7IGkgPCBpbDsgaSsrLCBqKyspXHJcbiAgICAgICAgdG9bal0gPSBmcm9tW2ldO1xyXG4gICAgcmV0dXJuIHRvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gZ2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByaXZhdGVNYXAuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHByaXZhdGVNYXAsIHZhbHVlKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gc2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcHJpdmF0ZU1hcC5zZXQocmVjZWl2ZXIsIHZhbHVlKTtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4iLCJpbXBvcnQgeyBFZGl0b3IgfSBmcm9tICdjb2RlbWlycm9yJztcclxuXHJcbmV4cG9ydCB0eXBlIExpbmtIaW50VHlwZSA9ICdpbnRlcm5hbCcgfCAnZXh0ZXJuYWwnO1xyXG5leHBvcnQgdHlwZSBMaW5rSGludE1vZGUgPSAnbW9kYWwnIHwgJ3BvcG92ZXJzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTGlua0hpbnRCYXNlIHtcclxuXHRsZXR0ZXI6IHN0cmluZztcclxuXHR0eXBlOiBMaW5rSGludFR5cGU7XHJcblx0bGlua1RleHQ6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3TGlua0hpbnQgZXh0ZW5kcyBMaW5rSGludEJhc2Uge1xyXG5cdGxlZnQ6IG51bWJlcjtcclxuXHR0b3A6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VMaW5rSGludCBleHRlbmRzIExpbmtIaW50QmFzZSB7XHJcblx0aW5kZXg6IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0dGluZ3Mge1xyXG5cdG1vZGU6IExpbmtIaW50TW9kZSA9ICdwb3BvdmVycyc7XHJcbn0iLCJpbXBvcnQgeyBBcHAsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IEVkaXRvciB9IGZyb20gJ2NvZGVtaXJyb3InO1xuaW1wb3J0IHsgTGlua0hpbnRCYXNlLCBMaW5rSGludE1vZGUsIExpbmtIaW50VHlwZSwgUHJldmlld0xpbmtIaW50LCBTZXR0aW5ncywgU291cmNlTGlua0hpbnQgfSBmcm9tICd0eXBlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEp1bXBUb0xpbmsgZXh0ZW5kcyBQbHVnaW4ge1xuICAgIGlzTGlua0hpbnRBY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBzZXR0aW5nczogU2V0dGluZ3M7XG4gICAgcHJlZml4SW5mbzogeyBwcmVmaXg6IHN0cmluZywgc2hpZnRLZXk6IGJvb2xlYW4gfSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGF3YWl0IHRoaXMubG9hZERhdGEoKSB8fCBuZXcgU2V0dGluZ3MoKTtcblxuICAgICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6ICdhY3RpdmF0ZS1qdW1wLXRvLWxpbmsnLFxuICAgICAgICAgICAgbmFtZTogJ0p1bXAgdG8gTGluaycsXG4gICAgICAgICAgICBjYWxsYmFjazogdGhpcy5oYW5kbGVKdW1wVG9MaW5rLFxuICAgICAgICAgICAgaG90a2V5czogW3ttb2RpZmllcnM6IFsnQ3RybCddLCBrZXk6ICdcXCcnfV1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBvbnVubG9hZCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3VubG9hZGluZyBqdW1wIHRvIGxpbmtzIHBsdWdpbicpO1xuICAgIH1cblxuICAgIGhhbmRsZUp1bXBUb0xpbmsgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzTGlua0hpbnRBY3RpdmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRWaWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYudmlldztcblxuICAgICAgICBpZiAoY3VycmVudFZpZXcuZ2V0U3RhdGUoKS5tb2RlID09PSAncHJldmlldycpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXdWaWV3RWw6IEhUTUxFbGVtZW50ID0gKGN1cnJlbnRWaWV3IGFzIGFueSkucHJldmlld01vZGUuY29udGFpbmVyRWwucXVlcnlTZWxlY3RvcignZGl2Lm1hcmtkb3duLXByZXZpZXctdmlldycpO1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VQcmV2aWV3TGlua0hpbnRzKHByZXZpZXdWaWV3RWwpO1xuICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRWaWV3LmdldFN0YXRlKCkubW9kZSA9PT0gJ3NvdXJjZScpIHtcbiAgICAgICAgICAgIGNvbnN0IGNtRWRpdG9yOiBFZGl0b3IgPSAoY3VycmVudFZpZXcgYXMgYW55KS5zb3VyY2VNb2RlLmNtRWRpdG9yO1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VTb3VyY2VMaW5rSGludHMoY21FZGl0b3IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG1hbmFnZVByZXZpZXdMaW5rSGludHMgPSAocHJldmlld1ZpZXdFbDogSFRNTEVsZW1lbnQpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgbGlua0hpbnRzID0gdGhpcy5nZXRQcmV2aWV3TGlua0hpbnRzKHByZXZpZXdWaWV3RWwpO1xuICAgICAgICBpZiAobGlua0hpbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubW9kZSA9PT0gJ21vZGFsJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheU1vZGFsKGxpbmtIaW50cyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MubW9kZSA9PT0gJ3BvcG92ZXJzJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheVByZXZpZXdQb3BvdmVycyhwcmV2aWV3Vmlld0VsLCBsaW5rSGludHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hY3RpdmF0ZUxpbmtIaW50cyhsaW5rSGludHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWFuYWdlU291cmNlTGlua0hpbnRzID0gKGNtRWRpdG9yOiBFZGl0b3IpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgbGlua0hpbnRzID0gdGhpcy5nZXRTb3VyY2VMaW5rSGludHMoY21FZGl0b3IpO1xuICAgICAgICBpZiAobGlua0hpbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubW9kZSA9PT0gJ21vZGFsJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheU1vZGFsKGxpbmtIaW50cyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MubW9kZSA9PT0gJ3BvcG92ZXJzJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheVNvdXJjZVBvcG92ZXJzKGNtRWRpdG9yLCBsaW5rSGludHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hY3RpdmF0ZUxpbmtIaW50cyhsaW5rSGludHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFjdGl2YXRlTGlua0hpbnRzID0gKGxpbmtIaW50czogTGlua0hpbnRCYXNlW10pOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgbGlua0hpbnRNYXA6IHsgW2xldHRlcjogc3RyaW5nXTogTGlua0hpbnRCYXNlIH0gPSB7fTtcbiAgICAgICAgbGlua0hpbnRzLmZvckVhY2goeCA9PiBsaW5rSGludE1hcFt4LmxldHRlcl0gPSB4KTtcblxuICAgICAgICBjb25zdCBoYW5kbGVIb3RrZXkgPSAobmV3TGVhZjogYm9vbGVhbiwgbGluazogTGlua0hpbnRCYXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAobGluay50eXBlID09PSAnaW50ZXJuYWwnKSB7XG4gICAgICAgICAgICAgICAgLy8gbm90IHN1cmUgd2h5IHRoZSBzZWNvbmQgYXJndW1lbnQgaW4gb3BlbkxpbmtUZXh0IGlzIG5lY2Vzc2FyeS5cbiAgICAgICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KGRlY29kZVVSSShsaW5rLmxpbmtUZXh0KSwgJycsIG5ld0xlYWYsIHsgYWN0aXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsaW5rLnR5cGUgPT09ICdleHRlcm5hbCcpIHtcbiAgICAgICAgICAgICAgICAvLyB0b2RvXG4gICAgICAgICAgICAgICAgcmVxdWlyZSgnZWxlY3Ryb24nKS5zaGVsbC5vcGVuRXh0ZXJuYWwobGluay5saW5rVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW1vdmVQb3BvdmVycyA9ICgpID0+IHtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVtb3ZlUG9wb3ZlcnMpXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuamwucG9wb3ZlcicpLmZvckVhY2goZSA9PiBlLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNqbC1tb2RhbCcpLmZvckVhY2goZSA9PiBlLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIHRoaXMucHJlZml4SW5mbyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuaXNMaW5rSGludEFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZGxlS2V5RG93biA9IChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJ1NoaWZ0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZXZlbnRLZXkgPSBldmVudC5rZXkudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeGVzID0gbmV3IFNldChPYmplY3Qua2V5cyhsaW5rSGludE1hcCkuZmlsdGVyKHggPT4geC5sZW5ndGggPiAxKS5tYXAoeCA9PiB4WzBdKSk7XG5cbiAgICAgICAgICAgIGxldCBsaW5rSGludDogTGlua0hpbnRCYXNlO1xuICAgICAgICAgICAgaWYgKHRoaXMucHJlZml4SW5mbykge1xuICAgICAgICAgICAgICAgIGxpbmtIaW50ID0gbGlua0hpbnRNYXBbdGhpcy5wcmVmaXhJbmZvLnByZWZpeCArIGV2ZW50S2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlua0hpbnQgPSBsaW5rSGludE1hcFtldmVudEtleV07XG4gICAgICAgICAgICAgICAgaWYgKCFsaW5rSGludCAmJiBwcmVmaXhlcyAmJiBwcmVmaXhlcy5oYXMoZXZlbnRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlZml4SW5mbyA9IHsgcHJlZml4OiBldmVudEtleSwgc2hpZnRLZXk6IGV2ZW50LnNoaWZ0S2V5IH07XG5cbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBjb25zdCBuZXdMZWFmID0gdGhpcy5wcmVmaXhJbmZvPy5zaGlmdEtleSB8fCBldmVudC5zaGlmdEtleTtcblxuICAgICAgICAgICAgbGlua0hpbnQgJiYgaGFuZGxlSG90a2V5KG5ld0xlYWYsIGxpbmtIaW50KTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleURvd24pO1xuICAgICAgICAgICAgcmVtb3ZlUG9wb3ZlcnMoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHJlbW92ZVBvcG92ZXJzKVxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bik7XG4gICAgICAgIHRoaXMuaXNMaW5rSGludEFjdGl2ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgZ2V0UHJldmlld0xpbmtIaW50cyA9IChwcmV2aWV3Vmlld0VsOiBIVE1MRWxlbWVudCk6IFByZXZpZXdMaW5rSGludFtdID0+IHtcbiAgICAgICAgY29uc3QgYW5jaG9yRWxzID0gcHJldmlld1ZpZXdFbC5xdWVyeVNlbGVjdG9yQWxsKCdhJyk7XG4gICAgICAgIGNvbnN0IGVtYmVkRWxzID0gcHJldmlld1ZpZXdFbC5xdWVyeVNlbGVjdG9yQWxsKCcuaW50ZXJuYWwtZW1iZWQnKTtcblxuICAgICAgICBjb25zdCBsaW5rSGludHM6IFByZXZpZXdMaW5rSGludFtdID0gW107XG4gICAgICAgIGFuY2hvckVscy5mb3JFYWNoKChhbmNob3JFbCwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGlua1R5cGU6IExpbmtIaW50VHlwZSA9IGFuY2hvckVsLmhhc0NsYXNzKCdpbnRlcm5hbC1saW5rJylcbiAgICAgICAgICAgICAgICA/ICdpbnRlcm5hbCdcbiAgICAgICAgICAgICAgICA6ICdleHRlcm5hbCc7XG5cbiAgICAgICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gbGlua1R5cGUgPT09ICdpbnRlcm5hbCdcbiAgICAgICAgICAgICAgICA/IGFuY2hvckVsLmRhdGFzZXRbJ2hyZWYnXVxuICAgICAgICAgICAgICAgIDogYW5jaG9yRWwuaHJlZjtcblxuICAgICAgICAgICAgbGV0IG9mZnNldFBhcmVudCA9IGFuY2hvckVsLm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGxldCB0b3AgPSBhbmNob3JFbC5vZmZzZXRUb3A7XG4gICAgICAgICAgICBsZXQgbGVmdCA9IGFuY2hvckVsLm9mZnNldExlZnQ7XG5cbiAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0UGFyZW50ID09IHByZXZpZXdWaWV3RWwpIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcCArPSBvZmZzZXRQYXJlbnQub2Zmc2V0VG9wO1xuICAgICAgICAgICAgICAgICAgICBsZWZ0ICs9IG9mZnNldFBhcmVudC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGlua0hpbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIGxldHRlcjogJycsXG4gICAgICAgICAgICAgICAgbGlua1RleHQ6IGxpbmtUZXh0LFxuICAgICAgICAgICAgICAgIHR5cGU6IGxpbmtUeXBlLFxuICAgICAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGxlZnQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZW1iZWRFbHMuZm9yRWFjaCgoZW1iZWRFbCwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGlua1RleHQgPSBlbWJlZEVsLmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICAgICBjb25zdCBsaW5rRWwgPSBlbWJlZEVsLnF1ZXJ5U2VsZWN0b3IoJy5tYXJrZG93bi1lbWJlZC1saW5rJykgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgICAgICAgIGlmIChsaW5rVGV4dCAmJiBsaW5rRWwpIHtcbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0UGFyZW50ID0gbGlua0VsLm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICAgICBsZXQgdG9wID0gbGlua0VsLm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICBsZXQgbGVmdCA9IGxpbmtFbC5vZmZzZXRMZWZ0O1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0UGFyZW50ID09IHByZXZpZXdWaWV3RWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcCArPSBvZmZzZXRQYXJlbnQub2Zmc2V0VG9wO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCArPSBvZmZzZXRQYXJlbnQub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsaW5rSGludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxldHRlcjogJycsXG4gICAgICAgICAgICAgICAgICAgIGxpbmtUZXh0OiBsaW5rVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ludGVybmFsJyxcbiAgICAgICAgICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IGxlZnQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHNvcnRlZExpbmtIaW50cyA9IGxpbmtIaW50cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICBpZiAoYS50b3AgPiBiLnRvcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhLnRvcCA9PT0gYi50b3ApIHtcbiAgICAgICAgICAgICAgICBpZiAoYS5sZWZ0ID4gYi5sZWZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYS5sZWZ0ID09PSBiLmxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBsaW5rSGludExldHRlcnMgPSB0aGlzLmdldExpbmtIaW50TGV0dGVycyhzb3J0ZWRMaW5rSGludHMubGVuZ3RoKTtcblxuICAgICAgICBzb3J0ZWRMaW5rSGludHMuZm9yRWFjaCgobGlua0hpbnQsIGkpID0+IHtcbiAgICAgICAgICAgIGxpbmtIaW50LmxldHRlciA9IGxpbmtIaW50TGV0dGVyc1tpXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvcnRlZExpbmtIaW50cztcbiAgICB9XG5cbiAgICBnZXRTb3VyY2VMaW5rSGludHMgPSAoY21FZGl0b3I6IEVkaXRvcik6IFNvdXJjZUxpbmtIaW50W10gPT4ge1xuICAgICAgICAvLyBleHBlY3RpbmcgZWl0aGVyIFtbTGlua11dIG9yIFtbTGlua3xUaXRsZV1dXG4gICAgICAgIGNvbnN0IHJlZ0V4SW50ZXJuYWwgPSAvXFxbXFxbKC4rPykoXFx8Lis/KT9cXF1cXF0vZztcbiAgICAgICAgLy8gZXhwZWN0aW5nIFtUaXRsZV0oLi4vZXhhbXBsZS5tZClcbiAgICAgICAgY29uc3QgcmVnRXhNZEludGVybmFsID0gL1xcWy4rP1xcXVxcKCgoXFwuXFwufFxcd3xcXGQpLis/KVxcKS9nO1xuICAgICAgICAvLyBleHBlY3RpbmcgW1RpdGxlXShmaWxlOi8vbGluaykgb3IgW1RpdGxlXShodHRwczovL2xpbmspXG4gICAgICAgIGNvbnN0IHJlZ0V4RXh0ZXJuYWwgPSAvXFxbLis/XFxdXFwoKChodHRwcz86fGZpbGU6KS4rPylcXCkvZztcbiAgICAgICAgLy8gZXhwZWN0aW5nIGh0dHA6Ly9ob2dlaG9nZSBvciBodHRwczovL2hvZ2Vob2dlXG4gICAgICAgIGNvbnN0IHJlZ0V4VXJsID0gLyg/PD0gfFxcbnxeKShodHRwcz86XFwvXFwvW14gXFxuXSspL2c7XG5cbiAgICAgICAgY29uc3Qgc3RycyA9IGNtRWRpdG9yLmdldFZhbHVlKCk7XG5cbiAgICAgICAgbGV0IGxpbmtzV2l0aEluZGV4OiB7IGluZGV4OiBudW1iZXIsIHR5cGU6ICdpbnRlcm5hbCcgfCAnZXh0ZXJuYWwnLCBsaW5rVGV4dDogc3RyaW5nIH1bXSA9IFtdO1xuICAgICAgICBsZXQgcmVnRXhSZXN1bHQ7XG5cbiAgICAgICAgd2hpbGUocmVnRXhSZXN1bHQgPSByZWdFeEludGVybmFsLmV4ZWMoc3RycykpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gcmVnRXhSZXN1bHRbMV07XG4gICAgICAgICAgICBsaW5rc1dpdGhJbmRleC5wdXNoKHsgaW5kZXg6IHJlZ0V4UmVzdWx0LmluZGV4LCB0eXBlOiAnaW50ZXJuYWwnLCBsaW5rVGV4dCB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhNZEludGVybmFsLmV4ZWMoc3RycykpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gcmVnRXhSZXN1bHRbMV07XG4gICAgICAgICAgICBsaW5rc1dpdGhJbmRleC5wdXNoKHsgaW5kZXg6IHJlZ0V4UmVzdWx0LmluZGV4LCB0eXBlOiAnaW50ZXJuYWwnLCBsaW5rVGV4dCB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhFeHRlcm5hbC5leGVjKHN0cnMpKSB7XG4gICAgICAgICAgICBjb25zdCBsaW5rVGV4dCA9IHJlZ0V4UmVzdWx0WzFdO1xuICAgICAgICAgICAgbGlua3NXaXRoSW5kZXgucHVzaCh7IGluZGV4OiByZWdFeFJlc3VsdC5pbmRleCwgdHlwZTogJ2V4dGVybmFsJywgbGlua1RleHQgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhVcmwuZXhlYyhzdHJzKSkge1xuICAgICAgICAgICAgY29uc3QgbGlua1RleHQgPSByZWdFeFJlc3VsdFsxXTtcbiAgICAgICAgICAgIGxpbmtzV2l0aEluZGV4LnB1c2goeyBpbmRleDogcmVnRXhSZXN1bHQuaW5kZXgsIHR5cGU6ICdleHRlcm5hbCcsIGxpbmtUZXh0IH0pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsaW5rSGludExldHRlcnMgPSB0aGlzLmdldExpbmtIaW50TGV0dGVycyhsaW5rc1dpdGhJbmRleC5sZW5ndGgpO1xuXG4gICAgICAgIGNvbnN0IGxpbmtzV2l0aExldHRlcjogU291cmNlTGlua0hpbnRbXSA9IFtdO1xuICAgICAgICBsaW5rc1dpdGhJbmRleFxuICAgICAgICAgICAgLnNvcnQoKHgseSkgPT4geC5pbmRleCAtIHkuaW5kZXgpXG4gICAgICAgICAgICAuZm9yRWFjaCgobGlua0hpbnQsIGkpID0+IHtcbiAgICAgICAgICAgICAgICBsaW5rc1dpdGhMZXR0ZXIucHVzaCh7IGxldHRlcjogbGlua0hpbnRMZXR0ZXJzW2ldLCAuLi5saW5rSGludH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGxpbmtzV2l0aExldHRlcjtcbiAgICB9XG5cbiAgICBnZXRMaW5rSGludExldHRlcnMgPSAobnVtTGlua0hpbnRzOiBudW1iZXIpOiBzdHJpbmdbXSA9PiB7XG4gICAgICAgIGNvbnN0IGFscGhhYmV0ID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWlwiXG5cbiAgICAgICAgbGV0IHByZWZpeENvdW50ID0gTWF0aC5jZWlsKChudW1MaW5rSGludHMgLSBhbHBoYWJldC5sZW5ndGgpIC8gKGFscGhhYmV0Lmxlbmd0aCAtIDEpKVxuXG4gICAgICAgIC8vIGVuc3VyZSAwIDw9IHByZWZpeENvdW50IDw9IGFscGhhYmV0Lmxlbmd0aFxuICAgICAgICBwcmVmaXhDb3VudCA9IE1hdGgubWF4KHByZWZpeENvdW50LCAwKTtcbiAgICAgICAgcHJlZml4Q291bnQgPSBNYXRoLm1pbihwcmVmaXhDb3VudCwgYWxwaGFiZXQubGVuZ3RoKTtcblxuICAgICAgICBjb25zdCBwcmVmaXhlcyA9IFsnJywgLi4uQXJyYXkuZnJvbShhbHBoYWJldC5zbGljZSgwLCBwcmVmaXhDb3VudCkpXTtcblxuICAgICAgICBjb25zdCBsaW5rSGludExldHRlcnMgPSBbXVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwcmVmaXggPSBwcmVmaXhlc1tpXVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhbHBoYWJldC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChsaW5rSGludExldHRlcnMubGVuZ3RoIDwgbnVtTGlua0hpbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxldHRlciA9IGFscGhhYmV0W2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJlZml4ID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwcmVmaXhlcy5pbmNsdWRlcyhsZXR0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlua0hpbnRMZXR0ZXJzLnB1c2gobGV0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtIaW50TGV0dGVycy5wdXNoKHByZWZpeCArIGxldHRlcilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaW5rSGludExldHRlcnM7XG4gICAgfVxuXG4gICAgZGlzcGxheU1vZGFsID0gKGxpbmtIaW50czogTGlua0hpbnRCYXNlW10pOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgbW9kYWxFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBtb2RhbEVsLmlubmVySFRNTCA9ICBgXG5cdFx0XHQ8ZGl2IGNsYXNzPVwibW9kYWwtY29udGFpbmVyXCIgaWQ9XCJqbC1tb2RhbFwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwibW9kYWwtYmdcIj48L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cIm1vZGFsXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cIm1vZGFsLWNsb3NlLWJ1dHRvblwiPjwvZGl2PlxuXHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJtb2RhbC10aXRsZVwiPkp1bXAgdG8gbGlua3M8L2Rpdj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwibW9kYWwtY29udGVudFwiPjwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdGA7XG4gICAgICAgIG1vZGFsRWwucXVlcnlTZWxlY3RvcignLm1vZGFsLWNsb3NlLWJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbW9kYWxFbC5yZW1vdmUpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1vZGFsRWwpO1xuXG4gICAgICAgIGNvbnN0IGxpbmtFbCA9IChjb250ZW50OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSBjb250ZW50O1xuICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG1vZGFsQ29udGVudEVsID0gbW9kYWxFbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY29udGVudCcpO1xuICAgICAgICBsaW5rSGludHMuZm9yRWFjaCgobGlua0hpbnQ6IExpbmtIaW50QmFzZSkgPT5cbiAgICAgICAgICAgIG1vZGFsQ29udGVudEVsLmFwcGVuZENoaWxkKGxpbmtFbChsaW5rSGludC5sZXR0ZXIgKyAnICcgKyBsaW5rSGludC5saW5rVGV4dCkpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZGlzcGxheVByZXZpZXdQb3BvdmVycyA9IChtYXJrZG93blByZXZpZXdWaWV3RWw6IEhUTUxFbGVtZW50LCBsaW5rSGludHM6IFByZXZpZXdMaW5rSGludFtdKTogdm9pZCA9PiB7XG4gICAgICAgIGZvciAobGV0IGxpbmtIaW50IG9mIGxpbmtIaW50cykge1xuICAgICAgICAgICAgY29uc3QgbGlua0hpbnRFbCA9IG1hcmtkb3duUHJldmlld1ZpZXdFbC5jcmVhdGVFbCgnZGl2Jyk7XG4gICAgICAgICAgICBsaW5rSGludEVsLnN0eWxlLnRvcCA9IGxpbmtIaW50LnRvcCArICdweCc7XG4gICAgICAgICAgICBsaW5rSGludEVsLnN0eWxlLmxlZnQgPSBsaW5rSGludC5sZWZ0ICsgJ3B4JztcblxuICAgICAgICAgICAgbGlua0hpbnRFbC50ZXh0Q29udGVudCA9IGxpbmtIaW50LmxldHRlcjtcbiAgICAgICAgICAgIGxpbmtIaW50RWwuYWRkQ2xhc3MoJ2psJyk7XG4gICAgICAgICAgICBsaW5rSGludEVsLmFkZENsYXNzKCdwb3BvdmVyJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNwbGF5U291cmNlUG9wb3ZlcnMgPSAoY21FZGl0b3I6IEVkaXRvciwgbGlua0tleU1hcDogU291cmNlTGlua0hpbnRbXSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjcmVhdGVXaWRnZXRFbGVtZW50ID0gKGNvbnRlbnQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgbGlua0hpbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbGlua0hpbnRFbC5hZGRDbGFzcygnamwnKTtcbiAgICAgICAgICAgIGxpbmtIaW50RWwuYWRkQ2xhc3MoJ3BvcG92ZXInKTtcbiAgICAgICAgICAgIGxpbmtIaW50RWwuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICAgICAgICAgIHJldHVybiBsaW5rSGludEVsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZHJhd1dpZGdldCA9IChjbUVkaXRvcjogRWRpdG9yLCBsaW5rSGludDogU291cmNlTGlua0hpbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvcyA9IGNtRWRpdG9yLnBvc0Zyb21JbmRleChsaW5rSGludC5pbmRleCk7XG4gICAgICAgICAgICAvLyB0aGUgZm91cnRoIHBhcmFtZXRlciBpcyB1bmRvY3VtZW50ZWQuIGl0IHNwZWNpZmllcyB3aGVyZSB0aGUgd2lkZ2V0IHNob3VsZCBiZSBwbGFjZVxuICAgICAgICAgICAgcmV0dXJuIChjbUVkaXRvciBhcyBhbnkpLmFkZFdpZGdldChwb3MsIGNyZWF0ZVdpZGdldEVsZW1lbnQobGlua0hpbnQubGV0dGVyKSwgZmFsc2UsICdvdmVyJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsaW5rS2V5TWFwLmZvckVhY2goeCA9PiBkcmF3V2lkZ2V0KGNtRWRpdG9yLCB4KSk7XG4gICAgfVxufVxuXG5jbGFzcyBTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gICAgcGx1Z2luOiBKdW1wVG9MaW5rXG5cbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBKdW1wVG9MaW5rKSB7XG4gICAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKVxuXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luXG4gICAgfVxuXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICAgICAgbGV0IHtjb250YWluZXJFbH0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywge3RleHQ6ICdTZXR0aW5ncyBmb3IgSnVtcCBUbyBMaW5rLid9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdQcmVzZW50YXRpb24nKVxuICAgICAgICAgICAgLnNldERlc2MoJ0hvdyB0byBzaG93IGxpbmtzJylcbiAgICAgICAgICAgIC5hZGREcm9wZG93bihjYiA9PiB7IGNiXG4gICAgICAgICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgICAgICAgICBcInBvcG92ZXJzXCI6ICdQb3BvdmVycycsXG4gICAgICAgICAgICAgICAgICAgIFwibW9kYWxcIjogJ01vZGFsJ1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm1vZGUpXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZTogTGlua0hpbnRNb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm1vZGUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG4iXSwibmFtZXMiOlsiUGx1Z2luIiwiU2V0dGluZyIsIlBsdWdpblNldHRpbmdUYWIiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDbkcsUUFBUSxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7QUFDdEcsUUFBUSxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7QUFDdEgsUUFBUSxJQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDOUUsS0FBSyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBQ0Q7QUFDTyxTQUFTLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBQzNDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNySCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLE1BQU0sS0FBSyxVQUFVLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxXQUFXLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzdKLElBQUksU0FBUyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDdEUsSUFBSSxTQUFTLElBQUksQ0FBQyxFQUFFLEVBQUU7QUFDdEIsUUFBUSxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksU0FBUyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFDdEUsUUFBUSxPQUFPLENBQUMsRUFBRSxJQUFJO0FBQ3RCLFlBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFF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
