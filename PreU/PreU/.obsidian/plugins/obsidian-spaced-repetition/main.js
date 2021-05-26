'use strict';

var obsidian = require('obsidian');

function forOwn(object, callback) {
    if ((typeof object === 'object') && (typeof callback === 'function')) {
        for (var key in object) {
            if (object.hasOwnProperty(key) === true) {
                if (callback(key, object[key]) === false) {
                    break;
                }
            }
        }
    }
}

var lib = (function () {
    var self = {
        count: 0,
        edges: {},
        nodes: {}
    };

    self.link = function (source, target, weight) {
        if ((isFinite(weight) !== true) || (weight === null)) {
            weight = 1;
        }
        
        weight = parseFloat(weight);

        if (self.nodes.hasOwnProperty(source) !== true) {
            self.count++;
            self.nodes[source] = {
                weight: 0,
                outbound: 0
            };
        }

        self.nodes[source].outbound += weight;

        if (self.nodes.hasOwnProperty(target) !== true) {
            self.count++;
            self.nodes[target] = {
                weight: 0,
                outbound: 0
            };
        }

        if (self.edges.hasOwnProperty(source) !== true) {
            self.edges[source] = {};
        }

        if (self.edges[source].hasOwnProperty(target) !== true) {
            self.edges[source][target] = 0;
        }

        self.edges[source][target] += weight;
    };

    self.rank = function (alpha, epsilon, callback) {
        var delta = 1,
            inverse = 1 / self.count;

        forOwn(self.edges, function (source) {
            if (self.nodes[source].outbound > 0) {
                forOwn(self.edges[source], function (target) {
                    self.edges[source][target] /= self.nodes[source].outbound;
                });
            }
        });

        forOwn(self.nodes, function (key) {
            self.nodes[key].weight = inverse;
        });

        while (delta > epsilon) {
            var leak = 0,
                nodes = {};

            forOwn(self.nodes, function (key, value) {
                nodes[key] = value.weight;

                if (value.outbound === 0) {
                    leak += value.weight;
                }

                self.nodes[key].weight = 0;
            });

            leak *= alpha;

            forOwn(self.nodes, function (source) {
                forOwn(self.edges[source], function (target, weight) {
                    self.nodes[target].weight += alpha * nodes[source] * weight;
                });

                self.nodes[source].weight += (1 - alpha) * inverse + leak * inverse;
            });

            delta = 0;

            forOwn(self.nodes, function (key, value) {
                delta += Math.abs(value.weight - nodes[key]);
            });
        }

        forOwn(self.nodes, function (key) {
            return callback(key, self.nodes[key].weight);
        });
    };

    self.reset = function () {
        self.count = 0;
        self.edges = {};
        self.nodes = {};
    };

    return self;
})();

// https://stackoverflow.com/a/6969486/12938797
function escapeRegexString(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const DEFAULT_SETTINGS = {
    // flashcards
    flashcardTags: ["#flashcards"],
    cardCommentOnSameLine: false,
    buryRelatedCards: false,
    showContextInCards: true,
    disableClozeCards: false,
    disableSinglelineCards: false,
    singlelineCardSeparator: "::",
    disableSinglelineReversedCards: false,
    singlelineReversedCardSeparator: ":::",
    disableMultilineCards: false,
    multilineCardSeparator: "?",
    disableMultilineReversedCards: false,
    multilineReversedCardSeparator: "??",
    // notes
    tagsToReview: ["#review"],
    openRandomNote: false,
    autoNextNote: false,
    disableFileMenuReviewOptions: false,
    maxNDaysNotesReviewQueue: 365,
    // algorithm
    baseEase: 250,
    lapsesIntervalChange: 0.5,
    easyBonus: 1.3,
    maximumInterval: 36525,
    maxLinkFactor: 1.0,
};
function getSetting(settingName, settingsObj) {
    let value = settingsObj[settingName];
    value ??= DEFAULT_SETTINGS[settingName];
    return value;
}
// https://github.com/mgmeyers/obsidian-kanban/blob/main/src/Settings.ts
let applyDebounceTimer = 0;
function applySettingsUpdate(callback) {
    clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(callback, 512);
}
class SRSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createDiv().innerHTML =
            "<h2>Spaced Repetition Plugin - Settings</h2>";
        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki">wiki</a>.';
        containerEl.createDiv().innerHTML = "<h3>Flashcards</h3>";
        new obsidian.Setting(containerEl)
            .setName("Flashcard tags")
            .setDesc("Enter tags separated by spaces i.e. #flashcards #deck2 #deck3.")
            .addTextArea((text) => text
            .setValue(`${getSetting("flashcardTags", this.plugin.data.settings).join(" ")}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.flashcardTags =
                    value.split(" ");
                await this.plugin.savePluginData();
            });
        }));
        new obsidian.Setting(containerEl)
            .setName("Save scheduling comment on the same line as the flashcard's last line?")
            .setDesc("Turning this on will make the HTML comments not break list formatting.")
            .addToggle((toggle) => toggle
            .setValue(getSetting("cardCommentOnSameLine", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.cardCommentOnSameLine = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Bury related cards until the next review session?")
            .setDesc("This applies to other cloze deletions in cloze cards.")
            .addToggle((toggle) => toggle
            .setValue(getSetting("buryRelatedCards", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.buryRelatedCards = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Show context in cards?")
            .setDesc("i.e. Title > Heading 1 > Subheading > ... > Subheading")
            .addToggle((toggle) => toggle
            .setValue(getSetting("showContextInCards", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.showContextInCards = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Disable cloze cards?")
            .setDesc("If you're not currently using 'em & would like the plugin to run a tad faster.")
            .addToggle((toggle) => toggle
            .setValue(getSetting("disableClozeCards", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.disableClozeCards = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Separator for inline flashcards")
            .setDesc("Note that after changing this you have to manually edit any flashcards you already have.")
            .addText((text) => text
            .setValue(`${getSetting("singlelineCardSeparator", this.plugin.data.settings)}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.singlelineCardSeparator =
                    value;
                await this.plugin.savePluginData();
                this.plugin.singlelineCardRegex = new RegExp(`^(.+)${escapeRegexString(value)}(.+?)\\n?(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`, "gm");
            });
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.singlelineCardSeparator =
                    DEFAULT_SETTINGS.singlelineCardSeparator;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Separator for multiline flashcards")
            .setDesc("Note that after changing this you have to manually edit any flashcards you already have.")
            .addText((text) => text
            .setValue(`${getSetting("multilineCardSeparator", this.plugin.data.settings)}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.multilineCardSeparator =
                    value;
                await this.plugin.savePluginData();
                this.plugin.multilineCardRegex = new RegExp(`^((?:.+\\n)+)${escapeRegexString(value)}\\n((?:.+?\\n?)+?)(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`, "gm");
            });
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.multilineCardSeparator =
                    DEFAULT_SETTINGS.multilineCardSeparator;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        containerEl.createDiv().innerHTML = "<h3>Notes</h3>";
        new obsidian.Setting(containerEl)
            .setName("Tags to review")
            .setDesc("Enter tags separated by spaces i.e. #review #tag2 #tag3.")
            .addTextArea((text) => text
            .setValue(`${getSetting("tagsToReview", this.plugin.data.settings).join(" ")}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                this.plugin.data.settings.tagsToReview =
                    value.split(" ");
                await this.plugin.savePluginData();
            });
        }));
        new obsidian.Setting(containerEl)
            .setName("Open a random note for review")
            .setDesc("When you turn this off, notes are ordered by importance (PageRank).")
            .addToggle((toggle) => toggle
            .setValue(getSetting("openRandomNote", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.openRandomNote = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Open next note automatically after a review")
            .setDesc("For faster reviews.")
            .addToggle((toggle) => toggle
            .setValue(getSetting("autoNextNote", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.autoNextNote = value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Disable review options in the file menu i.e. Review: Easy Good Hard")
            .setDesc("After disabling, you can review using the command hotkeys. Reload Obsidian after changing this.")
            .addToggle((toggle) => toggle
            .setValue(getSetting("disableFileMenuReviewOptions", this.plugin.data.settings))
            .onChange(async (value) => {
            this.plugin.data.settings.disableFileMenuReviewOptions =
                value;
            await this.plugin.savePluginData();
        }));
        new obsidian.Setting(containerEl)
            .setName("Maximum number of days to display on right panel")
            .setDesc("Reduce this for a cleaner interface.")
            .addText((text) => text
            .setValue(`${getSetting("maxNDaysNotesReviewQueue", this.plugin.data.settings)}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value);
                if (!isNaN(numValue)) {
                    if (numValue < 1) {
                        new obsidian.Notice("The number of days must be at least 1.");
                        text.setValue(`${this.plugin.data.settings.maxNDaysNotesReviewQueue}`);
                        return;
                    }
                    this.plugin.data.settings.maxNDaysNotesReviewQueue =
                        numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice("Please provide a valid number.");
                }
            });
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.maxNDaysNotesReviewQueue =
                    DEFAULT_SETTINGS.maxNDaysNotesReviewQueue;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        containerEl.createDiv().innerHTML = "<h3>Algorithm</h3>";
        containerEl.createDiv().innerHTML =
            'For more information, check the <a href="https://github.com/st3v3nmw/obsidian-spaced-repetition/wiki/Spaced-Repetition-Algorithm">algorithm implementation</a>.';
        new obsidian.Setting(containerEl)
            .setName("Base ease")
            .setDesc("minimum = 130, preferrably approximately 250.")
            .addText((text) => text
            .setValue(`${getSetting("baseEase", this.plugin.data.settings)}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value);
                if (!isNaN(numValue)) {
                    if (numValue < 130) {
                        new obsidian.Notice("The base ease must be at least 130.");
                        text.setValue(`${this.plugin.data.settings.baseEase}`);
                        return;
                    }
                    this.plugin.data.settings.baseEase = numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice("Please provide a valid number.");
                }
            });
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.baseEase =
                    DEFAULT_SETTINGS.baseEase;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Interval change when you review a flashcard/note as hard")
            .setDesc("newInterval = oldInterval * intervalChange / 100.")
            .addSlider((slider) => slider
            .setLimits(1, 99, 1)
            .setValue(getSetting("lapsesIntervalChange", this.plugin.data.settings) * 100)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.data.settings.lapsesIntervalChange = value;
            await this.plugin.savePluginData();
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.lapsesIntervalChange =
                    DEFAULT_SETTINGS.lapsesIntervalChange;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Easy bonus")
            .setDesc("The easy bonus allows you to set the difference in intervals between answering Good and Easy on a flashcard/note (minimum = 100%).")
            .addText((text) => text
            .setValue(`${getSetting("easyBonus", this.plugin.data.settings) *
            100}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value) / 100;
                if (!isNaN(numValue)) {
                    if (numValue < 1.0) {
                        new obsidian.Notice("The easy bonus must be at least 100.");
                        text.setValue(`${this.plugin.data.settings
                            .easyBonus * 100}`);
                        return;
                    }
                    this.plugin.data.settings.easyBonus = numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice("Please provide a valid number.");
                }
            });
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.easyBonus =
                    DEFAULT_SETTINGS.easyBonus;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Maximum Interval")
            .setDesc("Allows you to place an upper limit on the interval (default = 100 years).")
            .addText((text) => text
            .setValue(`${getSetting("maximumInterval", this.plugin.data.settings)}`)
            .onChange((value) => {
            applySettingsUpdate(async () => {
                let numValue = Number.parseInt(value);
                if (!isNaN(numValue)) {
                    if (numValue < 1) {
                        new obsidian.Notice("The maximum interval must be at least 1 day.");
                        text.setValue(`${this.plugin.data.settings.maximumInterval}`);
                        return;
                    }
                    this.plugin.data.settings.maximumInterval =
                        numValue;
                    await this.plugin.savePluginData();
                }
                else {
                    new obsidian.Notice("Please provide a valid number.");
                }
            });
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.maximumInterval =
                    DEFAULT_SETTINGS.maximumInterval;
                await this.plugin.savePluginData();
                this.display();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("Maximum link contribution")
            .setDesc("Maximum contribution of the weighted ease of linked notes to the initial ease.")
            .addSlider((slider) => slider
            .setLimits(0, 100, 1)
            .setValue(getSetting("maxLinkFactor", this.plugin.data.settings) *
            100)
            .setDynamicTooltip()
            .onChange(async (value) => {
            this.plugin.data.settings.maxLinkFactor = value;
            await this.plugin.savePluginData();
        }))
            .addExtraButton((button) => {
            button
                .setIcon("reset")
                .setTooltip("Reset to default")
                .onClick(async () => {
                this.plugin.data.settings.maxLinkFactor =
                    DEFAULT_SETTINGS.maxLinkFactor;
                await this.plugin.savePluginData();
                this.display();
            });
        });
    }
}

var ReviewResponse;
(function (ReviewResponse) {
    ReviewResponse[ReviewResponse["Easy"] = 0] = "Easy";
    ReviewResponse[ReviewResponse["Good"] = 1] = "Good";
    ReviewResponse[ReviewResponse["Hard"] = 2] = "Hard";
    ReviewResponse[ReviewResponse["Reset"] = 3] = "Reset";
})(ReviewResponse || (ReviewResponse = {}));
var CardType;
(function (CardType) {
    CardType[CardType["SingleLineBasic"] = 0] = "SingleLineBasic";
    CardType[CardType["MultiLineBasic"] = 1] = "MultiLineBasic";
    CardType[CardType["Cloze"] = 2] = "Cloze";
})(CardType || (CardType = {}));
var FlashcardModalMode;
(function (FlashcardModalMode) {
    FlashcardModalMode[FlashcardModalMode["DecksList"] = 0] = "DecksList";
    FlashcardModalMode[FlashcardModalMode["Front"] = 1] = "Front";
    FlashcardModalMode[FlashcardModalMode["Back"] = 2] = "Back";
    FlashcardModalMode[FlashcardModalMode["Closed"] = 3] = "Closed";
})(FlashcardModalMode || (FlashcardModalMode = {}));

function schedule(response, interval, ease, fuzz, settingsObj) {
    let lapsesIntervalChange = getSetting("lapsesIntervalChange", settingsObj);
    let easyBonus = getSetting("easyBonus", settingsObj);
    let maximumInterval = getSetting("maximumInterval", settingsObj);
    if (response != ReviewResponse.Good) {
        ease =
            response == ReviewResponse.Easy
                ? ease + 20
                : Math.max(130, ease - 20);
    }
    if (response == ReviewResponse.Hard)
        interval = Math.max(1, interval * lapsesIntervalChange);
    else
        interval = (interval * ease) / 100;
    if (response == ReviewResponse.Easy)
        interval *= easyBonus;
    if (fuzz) {
        // fuzz
        if (interval >= 8) {
            let fuzz = [-0.05 * interval, 0, 0.05 * interval];
            interval += fuzz[Math.floor(Math.random() * fuzz.length)];
        }
    }
    interval = Math.min(interval, maximumInterval);
    return { interval: Math.round(interval * 10) / 10, ease };
}
function textInterval(interval, isMobile) {
    let m = Math.round(interval / 3) / 10;
    let y = Math.round(interval / 36.5) / 10;
    if (isMobile) {
        if (interval < 30)
            return `${interval}d`;
        else if (interval < 365)
            return `${m}m`;
        else
            return `${y}y`;
    }
    else {
        if (interval < 30)
            return interval == 1.0 ? "1.0 day" : `${interval} days`;
        else if (interval < 365)
            return m == 1.0 ? "1.0 month" : `${m} months`;
        else
            return y == 1.0 ? "1.0 year" : `${y} years`;
    }
}

const SCHEDULING_INFO_REGEX = /^---\n((?:.*\n)*)sr-due: (.+)\nsr-interval: (\d+)\nsr-ease: (\d+)\n((?:.*\n)*)---/;
const YAML_FRONT_MATTER_REGEX = /^---\n((?:.*\n)*?)---/;
const CLOZE_CARD_DETECTOR = /(?:.+\n)*^.*?==.*?==.*\n(?:.+\n?)*/gm; // card must have at least one cloze
const CLOZE_DELETIONS_EXTRACTOR = /==(.*?)==/gm;
const CLOZE_SCHEDULING_EXTRACTOR = /!([\d-]+),(\d+),(\d+)/gm;
const WIKILINK_MEDIA_REGEX = /!\[\[(.*?.(?:png|jpe?g|gif|bmp|svg)).*?\]\]/gm; // ![[...]] format
const MARKDOWN_LINK_MEDIA_REGEX = /!\[.*\]\((.*.(?:png|jpe?g|gif|bmp|svg))\)/gm; // ![...](...) format
const CODEBLOCK_REGEX = /```(?:.*\n)*?```/gm;
const INLINE_CODE_REGEX = /`(?!`).+`/gm;
const CROSS_HAIRS_ICON = `<path style=" stroke:none;fill-rule:nonzero;fill:currentColor;fill-opacity:1;" d="M 99.921875 47.941406 L 93.074219 47.941406 C 92.84375 42.03125 91.390625 36.238281 88.800781 30.921875 L 85.367188 32.582031 C 87.667969 37.355469 88.964844 42.550781 89.183594 47.84375 L 82.238281 47.84375 C 82.097656 44.617188 81.589844 41.417969 80.734375 38.304688 L 77.050781 39.335938 C 77.808594 42.089844 78.261719 44.917969 78.40625 47.769531 L 65.871094 47.769531 C 64.914062 40.507812 59.144531 34.832031 51.871094 33.996094 L 51.871094 21.386719 C 54.816406 21.507812 57.742188 21.960938 60.585938 22.738281 L 61.617188 19.058594 C 58.4375 18.191406 55.164062 17.691406 51.871094 17.570312 L 51.871094 10.550781 C 57.164062 10.769531 62.355469 12.066406 67.132812 14.363281 L 68.789062 10.929688 C 63.5 8.382812 57.738281 6.953125 51.871094 6.734375 L 51.871094 0.0390625 L 48.054688 0.0390625 L 48.054688 6.734375 C 42.179688 6.976562 36.417969 8.433594 31.132812 11.007812 L 32.792969 14.441406 C 37.566406 12.140625 42.761719 10.84375 48.054688 10.625 L 48.054688 17.570312 C 44.828125 17.714844 41.628906 18.21875 38.515625 19.078125 L 39.546875 22.757812 C 42.324219 21.988281 45.175781 21.53125 48.054688 21.386719 L 48.054688 34.03125 C 40.796875 34.949219 35.089844 40.679688 34.203125 47.941406 L 21.5 47.941406 C 21.632812 45.042969 22.089844 42.171875 22.855469 39.375 L 19.171875 38.34375 C 18.3125 41.457031 17.808594 44.65625 17.664062 47.882812 L 10.664062 47.882812 C 10.882812 42.589844 12.179688 37.394531 14.480469 32.621094 L 11.121094 30.921875 C 8.535156 36.238281 7.078125 42.03125 6.847656 47.941406 L 0 47.941406 L 0 51.753906 L 6.847656 51.753906 C 7.089844 57.636719 8.542969 63.402344 11.121094 68.695312 L 14.554688 67.035156 C 12.257812 62.261719 10.957031 57.066406 10.738281 51.773438 L 17.742188 51.773438 C 17.855469 55.042969 18.34375 58.289062 19.191406 61.445312 L 22.871094 60.414062 C 22.089844 57.5625 21.628906 54.632812 21.5 51.679688 L 34.203125 51.679688 C 35.058594 58.96875 40.773438 64.738281 48.054688 65.660156 L 48.054688 78.308594 C 45.105469 78.1875 42.183594 77.730469 39.335938 76.957031 L 38.304688 80.636719 C 41.488281 81.511719 44.757812 82.015625 48.054688 82.144531 L 48.054688 89.144531 C 42.761719 88.925781 37.566406 87.628906 32.792969 85.328125 L 31.132812 88.765625 C 36.425781 91.3125 42.183594 92.742188 48.054688 92.960938 L 48.054688 99.960938 L 51.871094 99.960938 L 51.871094 92.960938 C 57.75 92.71875 63.519531 91.265625 68.808594 88.6875 L 67.132812 85.253906 C 62.355469 87.550781 57.164062 88.851562 51.871094 89.070312 L 51.871094 82.125 C 55.09375 81.980469 58.292969 81.476562 61.40625 80.617188 L 60.378906 76.9375 C 57.574219 77.703125 54.695312 78.15625 51.792969 78.289062 L 51.792969 65.679688 C 59.121094 64.828125 64.910156 59.0625 65.796875 51.734375 L 78.367188 51.734375 C 78.25 54.734375 77.789062 57.710938 76.992188 60.605469 L 80.675781 61.636719 C 81.558594 58.40625 82.066406 55.082031 82.183594 51.734375 L 89.261719 51.734375 C 89.042969 57.03125 87.742188 62.222656 85.445312 66.996094 L 88.878906 68.65625 C 91.457031 63.367188 92.910156 57.597656 93.152344 51.71875 L 100 51.71875 Z M 62.019531 51.734375 C 61.183594 56.945312 57.085938 61.023438 51.871094 61.828125 L 51.871094 57.515625 L 48.054688 57.515625 L 48.054688 61.808594 C 42.910156 60.949219 38.886719 56.902344 38.058594 51.753906 L 42.332031 51.753906 L 42.332031 47.941406 L 38.058594 47.941406 C 38.886719 42.789062 42.910156 38.746094 48.054688 37.886719 L 48.054688 42.179688 L 51.871094 42.179688 L 51.871094 37.847656 C 57.078125 38.648438 61.179688 42.71875 62.019531 47.921875 L 57.707031 47.921875 L 57.707031 51.734375 Z M 62.019531 51.734375 "/>`;
const COLLAPSE_ICON = `<svg viewBox="0 0 100 100" width="8" height="8" class="right-triangle"><path fill="currentColor" stroke="currentColor" d="M94.9,20.8c-1.4-2.5-4.1-4.1-7.1-4.1H12.2c-3,0-5.7,1.6-7.1,4.1c-1.3,2.4-1.2,5.2,0.2,7.6L43.1,88c1.5,2.3,4,3.7,6.9,3.7 s5.4-1.4,6.9-3.7l37.8-59.6C96.1,26,96.2,23.2,94.9,20.8L94.9,20.8z"></path></svg>`;

class FlashcardModal extends obsidian.Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.titleEl.setText("Decks");
        if (obsidian.Platform.isMobile) {
            this.modalEl.style.height = "100%";
            this.modalEl.style.width = "100%";
            this.contentEl.style.display = "block";
        }
        else {
            this.modalEl.style.height = "80%";
            this.modalEl.style.width = "40%";
        }
        this.contentEl.style.position = "relative";
        this.contentEl.style.height = "92%";
        this.contentEl.addClass("sr-modal-content");
        document.body.onkeypress = (e) => {
            if (this.mode != FlashcardModalMode.DecksList) {
                if (this.mode != FlashcardModalMode.Closed &&
                    e.code == "KeyS") {
                    if (this.currentCard.isDue)
                        this.plugin.dueFlashcards[this.currentDeck].splice(0, 1);
                    else
                        this.plugin.newFlashcards[this.currentDeck].splice(0, 1);
                    if (this.currentCard.cardType == CardType.Cloze)
                        this.buryRelatedCards(this.currentCard.relatedCards);
                    this.nextCard();
                }
                else if (this.mode == FlashcardModalMode.Front &&
                    (e.code == "Space" || e.code == "Enter"))
                    this.showAnswer();
                else if (this.mode == FlashcardModalMode.Back) {
                    if (e.code == "Numpad1" || e.code == "Digit1")
                        this.processReview(ReviewResponse.Hard);
                    else if (e.code == "Numpad2" || e.code == "Digit2")
                        this.processReview(ReviewResponse.Good);
                    else if (e.code == "Numpad3" || e.code == "Digit3")
                        this.processReview(ReviewResponse.Easy);
                    else if (e.code == "Numpad0" || e.code == "Digit0")
                        this.processReview(ReviewResponse.Reset);
                }
            }
        };
    }
    onOpen() {
        this.decksList();
    }
    onClose() {
        this.mode = FlashcardModalMode.Closed;
    }
    decksList() {
        this.mode = FlashcardModalMode.DecksList;
        this.titleEl.setText("Decks");
        this.contentEl.innerHTML = "";
        let colHeading = this.contentEl.createDiv("sr-deck");
        colHeading.innerHTML =
            "<i></i><span style='text-align:right;'>Due</span>" +
                "<span style='text-align:right;'>New</span>";
        for (let deckName in this.plugin.dueFlashcards) {
            let deckView = this.contentEl.createDiv("sr-deck");
            deckView.setText(deckName);
            deckView.innerHTML +=
                `<span style="color:#4caf50;text-align:right;">${this.plugin.dueFlashcards[deckName].length}</span>` +
                    `<span style="color:#2196f3;text-align:right;">${this.plugin.newFlashcards[deckName].length}</span>`;
            deckView.addEventListener("click", (_) => {
                this.currentDeck = deckName;
                this.setupCardsView();
                this.nextCard();
            });
        }
    }
    setupCardsView() {
        this.contentEl.innerHTML = "";
        this.fileLinkView = createDiv("sr-link");
        this.fileLinkView.setText("Open file");
        this.fileLinkView.addEventListener("click", (_) => {
            this.close();
            this.plugin.app.workspace.activeLeaf.openFile(this.currentCard.note);
        });
        this.contentEl.appendChild(this.fileLinkView);
        this.resetLinkView = createDiv("sr-link");
        this.resetLinkView.setText("Reset card's progress");
        this.resetLinkView.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Reset);
        });
        this.resetLinkView.style.float = "right";
        this.contentEl.appendChild(this.resetLinkView);
        if (getSetting("showContextInCards", this.plugin.data.settings)) {
            this.contextView = document.createElement("div");
            this.contextView.setAttribute("id", "sr-context");
            this.contentEl.appendChild(this.contextView);
        }
        this.flashcardView = document.createElement("div");
        this.flashcardView.setAttribute("id", "sr-flashcard-view");
        this.contentEl.appendChild(this.flashcardView);
        this.responseDiv = createDiv("sr-response");
        this.hardBtn = document.createElement("button");
        this.hardBtn.setAttribute("id", "sr-hard-btn");
        this.hardBtn.setText("Hard");
        this.hardBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Hard);
        });
        this.responseDiv.appendChild(this.hardBtn);
        this.goodBtn = document.createElement("button");
        this.goodBtn.setAttribute("id", "sr-good-btn");
        this.goodBtn.setText("Good");
        this.goodBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Good);
        });
        this.responseDiv.appendChild(this.goodBtn);
        this.easyBtn = document.createElement("button");
        this.easyBtn.setAttribute("id", "sr-easy-btn");
        this.easyBtn.setText("Easy");
        this.easyBtn.addEventListener("click", (_) => {
            this.processReview(ReviewResponse.Easy);
        });
        this.responseDiv.appendChild(this.easyBtn);
        this.responseDiv.style.display = "none";
        this.contentEl.appendChild(this.responseDiv);
        this.answerBtn = document.createElement("div");
        this.answerBtn.setAttribute("id", "sr-show-answer");
        this.answerBtn.setText("Show Answer");
        this.answerBtn.addEventListener("click", (_) => {
            this.showAnswer();
        });
        this.contentEl.appendChild(this.answerBtn);
    }
    nextCard() {
        this.responseDiv.style.display = "none";
        this.resetLinkView.style.display = "none";
        let count = this.plugin.newFlashcards[this.currentDeck].length +
            this.plugin.dueFlashcards[this.currentDeck].length;
        this.titleEl.setText(`${this.currentDeck} - ${count}`);
        if (count == 0) {
            this.decksList();
            return;
        }
        this.answerBtn.style.display = "initial";
        this.flashcardView.innerHTML = "";
        this.mode = FlashcardModalMode.Front;
        if (this.plugin.dueFlashcards[this.currentDeck].length > 0) {
            this.currentCard = this.plugin.dueFlashcards[this.currentDeck][0];
            obsidian.MarkdownRenderer.renderMarkdown(this.currentCard.front, this.flashcardView, this.currentCard.note.path, null);
            let hardInterval = schedule(ReviewResponse.Hard, this.currentCard.interval, this.currentCard.ease, false, this.plugin.data.settings).interval;
            let goodInterval = schedule(ReviewResponse.Good, this.currentCard.interval, this.currentCard.ease, false, this.plugin.data.settings).interval;
            let easyInterval = schedule(ReviewResponse.Easy, this.currentCard.interval, this.currentCard.ease, false, this.plugin.data.settings).interval;
            if (obsidian.Platform.isMobile) {
                this.hardBtn.setText(textInterval(hardInterval, true));
                this.goodBtn.setText(textInterval(goodInterval, true));
                this.easyBtn.setText(textInterval(easyInterval, true));
            }
            else {
                this.hardBtn.setText(`Hard - ${textInterval(hardInterval, false)}`);
                this.goodBtn.setText(`Good - ${textInterval(goodInterval, false)}`);
                this.easyBtn.setText(`Easy - ${textInterval(easyInterval, false)}`);
            }
        }
        else if (this.plugin.newFlashcards[this.currentDeck].length > 0) {
            this.currentCard = this.plugin.newFlashcards[this.currentDeck][0];
            obsidian.MarkdownRenderer.renderMarkdown(this.currentCard.front, this.flashcardView, this.currentCard.note.path, null);
            if (obsidian.Platform.isMobile) {
                this.hardBtn.setText("1.0d");
                this.goodBtn.setText("2.5d");
                this.easyBtn.setText("3.5d");
            }
            else {
                this.hardBtn.setText("Hard - 1.0 day");
                this.goodBtn.setText("Good - 2.5 days");
                this.easyBtn.setText("Easy - 3.5 days");
            }
        }
        if (getSetting("showContextInCards", this.plugin.data.settings))
            this.contextView.setText(this.currentCard.context);
    }
    showAnswer() {
        this.mode = FlashcardModalMode.Back;
        this.answerBtn.style.display = "none";
        this.responseDiv.style.display = "grid";
        if (this.currentCard.isDue)
            this.resetLinkView.style.display = "inline-block";
        if (this.currentCard.cardType != CardType.Cloze) {
            let hr = document.createElement("hr");
            hr.setAttribute("id", "sr-hr-card-divide");
            this.flashcardView.appendChild(hr);
        }
        else
            this.flashcardView.innerHTML = "";
        obsidian.MarkdownRenderer.renderMarkdown(this.currentCard.back, this.flashcardView, this.currentCard.note.path, null);
    }
    async processReview(response) {
        let interval, ease, due;
        if (response != ReviewResponse.Reset) {
            // scheduled card
            if (this.currentCard.isDue) {
                this.plugin.dueFlashcards[this.currentDeck].splice(0, 1);
                let schedObj = schedule(response, this.currentCard.interval, this.currentCard.ease, true, this.plugin.data.settings);
                interval = Math.round(schedObj.interval);
                ease = schedObj.ease;
            }
            else {
                let schedObj = schedule(response, 1, getSetting("baseEase", this.plugin.data.settings), true, this.plugin.data.settings);
                this.plugin.newFlashcards[this.currentDeck].splice(0, 1);
                interval = Math.round(schedObj.interval);
                ease = schedObj.ease;
            }
            due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        }
        else {
            interval = 1.0;
            ease = this.plugin.data.settings.baseEase;
            this.plugin.dueFlashcards[this.currentDeck].splice(0, 1);
            this.plugin.dueFlashcards[this.currentDeck].push(this.currentCard);
            due = window.moment(Date.now());
            new obsidian.Notice("Card's progress has been reset");
        }
        let dueString = due.format("YYYY-MM-DD");
        let fileText = await this.app.vault.read(this.currentCard.note);
        let replacementRegex = new RegExp(escapeRegexString(this.currentCard.cardText), "gm");
        let sep = getSetting("cardCommentOnSameLine", this.plugin.data.settings)
            ? " "
            : "\n";
        if (this.currentCard.cardType == CardType.Cloze) {
            let schedIdx = this.currentCard.cardText.lastIndexOf("<!--SR:");
            if (schedIdx == -1) {
                // first time adding scheduling information to flashcard
                this.currentCard.cardText = `${this.currentCard.cardText}${sep}<!--SR:!${dueString},${interval},${ease}-->`;
            }
            else {
                let scheduling = [
                    ...this.currentCard.cardText.matchAll(CLOZE_SCHEDULING_EXTRACTOR),
                ];
                let deletionSched = ["0", dueString, `${interval}`, `${ease}`];
                if (this.currentCard.isDue)
                    scheduling[this.currentCard.subCardIdx] = deletionSched;
                else
                    scheduling.push(deletionSched);
                this.currentCard.cardText = this.currentCard.cardText.replace(/<!--SR:.+-->/gm, "");
                this.currentCard.cardText += "<!--SR:";
                for (let i = 0; i < scheduling.length; i++)
                    this.currentCard.cardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                this.currentCard.cardText += "-->";
            }
            fileText = fileText.replace(replacementRegex, this.currentCard.cardText);
            for (let relatedCard of this.currentCard.relatedCards)
                relatedCard.cardText = this.currentCard.cardText;
            if (this.plugin.data.settings.buryRelatedCards)
                this.buryRelatedCards(this.currentCard.relatedCards);
        }
        else {
            if (this.currentCard.cardType == CardType.SingleLineBasic) {
                fileText = fileText.replace(replacementRegex, `${this.currentCard.originalFrontText}${getSetting("singlelineCardSeparator", this.plugin.data.settings)}${this.currentCard.originalBackText}${sep}<!--SR:${dueString},${interval},${ease}-->`);
            }
            else {
                fileText = fileText.replace(replacementRegex, `${this.currentCard.originalFrontText}\n${getSetting("multilineCardSeparator", this.plugin.data.settings)}\n${this.currentCard.originalBackText}${sep}<!--SR:${dueString},${interval},${ease}-->`);
            }
        }
        await this.app.vault.modify(this.currentCard.note, fileText);
        this.nextCard();
    }
    buryRelatedCards(arr) {
        for (let relatedCard of arr) {
            let dueIdx = this.plugin.dueFlashcards[this.currentDeck].indexOf(relatedCard);
            let newIdx = this.plugin.newFlashcards[this.currentDeck].indexOf(relatedCard);
            if (dueIdx != -1)
                this.plugin.dueFlashcards[this.currentDeck].splice(dueIdx, 1);
            else if (newIdx != -1)
                this.plugin.newFlashcards[this.currentDeck].splice(newIdx, 1);
        }
    }
}

const REVIEW_QUEUE_VIEW_TYPE = "review-queue-list-view";
class ReviewQueueListView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.activeFolders = new Set(["Today"]);
        this.registerEvent(this.app.workspace.on("file-open", (_) => this.redraw()));
        this.registerEvent(this.app.vault.on("rename", (_) => this.redraw()));
    }
    getViewType() {
        return REVIEW_QUEUE_VIEW_TYPE;
    }
    getDisplayText() {
        return "Notes Review Queue";
    }
    getIcon() {
        return "crosshairs";
    }
    onHeaderMenu(menu) {
        menu.addItem((item) => {
            item.setTitle("Close")
                .setIcon("cross")
                .onClick(() => {
                this.app.workspace.detachLeavesOfType(REVIEW_QUEUE_VIEW_TYPE);
            });
        });
    }
    redraw() {
        const openFile = this.app.workspace.getActiveFile();
        const rootEl = createDiv("nav-folder mod-root");
        const childrenEl = rootEl.createDiv("nav-folder-children");
        if (this.plugin.newNotes.length > 0) {
            let newNotesFolderEl = this.createRightPaneFolder(childrenEl, "New", !this.activeFolders.has("New"));
            for (let newFile of this.plugin.newNotes) {
                this.createRightPaneFile(newNotesFolderEl, newFile, openFile && newFile.path === openFile.path, !this.activeFolders.has("New"));
            }
        }
        if (this.plugin.scheduledNotes.length > 0) {
            let now = Date.now();
            let currUnix = -1;
            let folderEl, folderTitle;
            let maxDaysToRender = getSetting("maxNDaysNotesReviewQueue", this.plugin.data.settings);
            for (let sNote of this.plugin.scheduledNotes) {
                if (sNote.dueUnix != currUnix) {
                    let nDays = Math.ceil((sNote.dueUnix - now) / (24 * 3600 * 1000));
                    if (nDays > maxDaysToRender)
                        break;
                    folderTitle =
                        nDays == -1
                            ? "Yesterday"
                            : nDays == 0
                                ? "Today"
                                : nDays == 1
                                    ? "Tomorrow"
                                    : new Date(sNote.dueUnix).toDateString();
                    folderEl = this.createRightPaneFolder(childrenEl, folderTitle, !this.activeFolders.has(folderTitle));
                    currUnix = sNote.dueUnix;
                }
                this.createRightPaneFile(folderEl, sNote.note, openFile && sNote.note.path === openFile.path, !this.activeFolders.has(folderTitle));
            }
        }
        const contentEl = this.containerEl.children[1];
        contentEl.empty();
        contentEl.appendChild(rootEl);
    }
    createRightPaneFolder(parentEl, folderTitle, collapsed) {
        const folderEl = parentEl.createDiv("nav-folder");
        const folderTitleEl = folderEl.createDiv("nav-folder-title");
        const childrenEl = folderEl.createDiv("nav-folder-children");
        const collapseIconEl = folderTitleEl.createDiv("nav-folder-collapse-indicator collapse-icon");
        collapseIconEl.innerHTML = COLLAPSE_ICON;
        if (collapsed)
            collapseIconEl.childNodes[0].style.transform = "rotate(-90deg)";
        folderTitleEl
            .createDiv("nav-folder-title-content")
            .setText(folderTitle);
        folderTitleEl.onClickEvent((_) => {
            for (let child of childrenEl.childNodes) {
                if (child.style.display == "block" ||
                    child.style.display == "") {
                    child.style.display = "none";
                    collapseIconEl.childNodes[0].style.transform =
                        "rotate(-90deg)";
                    this.activeFolders.delete(folderTitle);
                }
                else {
                    child.style.display = "block";
                    collapseIconEl.childNodes[0].style.transform = "";
                    this.activeFolders.add(folderTitle);
                }
            }
        });
        return childrenEl;
    }
    createRightPaneFile(folderEl, file, fileElActive, hidden) {
        const navFileEl = folderEl.createDiv("nav-file");
        if (hidden)
            navFileEl.style.display = "none";
        const navFileTitle = navFileEl.createDiv("nav-file-title");
        if (fileElActive)
            navFileTitle.addClass("is-active");
        navFileTitle.createDiv("nav-file-title-content").setText(file.basename);
        navFileTitle.addEventListener("click", (event) => {
            event.preventDefault();
            this.app.workspace.activeLeaf.openFile(file);
            return false;
        }, false);
        navFileTitle.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            const fileMenu = new obsidian.Menu(this.app);
            this.app.workspace.trigger("file-menu", fileMenu, file, "my-context-menu", null);
            fileMenu.showAtPosition({
                x: event.pageX,
                y: event.pageY,
            });
            return false;
        }, false);
    }
}

const DEFAULT_DATA = {
    settings: DEFAULT_SETTINGS,
};
class SRPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.newNotes = [];
        this.scheduledNotes = [];
        this.easeByPath = {};
        this.incomingLinks = {};
        this.pageranks = {};
        this.dueNotesCount = 0;
        this.newFlashcards = {}; // <deck name, Card[]>
        this.newFlashcardsCount = 0;
        this.dueFlashcards = {}; // <deck name, Card[]>
        this.dueFlashcardsCount = 0;
    }
    async onload() {
        await this.loadPluginData();
        obsidian.addIcon("crosshairs", CROSS_HAIRS_ICON);
        this.statusBar = this.addStatusBarItem();
        this.statusBar.classList.add("mod-clickable");
        this.statusBar.setAttribute("aria-label", "Open a note for review");
        this.statusBar.setAttribute("aria-label-position", "top");
        this.statusBar.addEventListener("click", (_) => {
            this.sync();
            this.reviewNextNote();
        });
        this.singlelineCardRegex = new RegExp(`^(.+)${escapeRegexString(getSetting("singlelineCardSeparator", this.data.settings))}(.+?)\\n?(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`, "gm");
        this.multilineCardRegex = new RegExp(`^((?:.+\\n)+)${escapeRegexString(getSetting("multilineCardSeparator", this.data.settings))}\\n((?:.+?\\n?)+?)(?:<!--SR:(.+),(\\d+),(\\d+)-->|$)`, "gm");
        this.addRibbonIcon("crosshairs", "Review flashcards", async () => {
            await this.flashcards_sync();
            new FlashcardModal(this.app, this).open();
        });
        this.registerView(REVIEW_QUEUE_VIEW_TYPE, (leaf) => (this.reviewQueueView = new ReviewQueueListView(leaf, this)));
        if (!this.data.settings.disableFileMenuReviewOptions) {
            this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
                menu.addItem((item) => {
                    item.setTitle("Review: Easy")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                        if (file.extension == "md")
                            this.saveReviewResponse(file, ReviewResponse.Easy);
                    });
                });
                menu.addItem((item) => {
                    item.setTitle("Review: Good")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                        if (file.extension == "md")
                            this.saveReviewResponse(file, ReviewResponse.Good);
                    });
                });
                menu.addItem((item) => {
                    item.setTitle("Review: Hard")
                        .setIcon("crosshairs")
                        .onClick((evt) => {
                        if (file.extension == "md")
                            this.saveReviewResponse(file, ReviewResponse.Hard);
                    });
                });
            }));
        }
        this.addCommand({
            id: "srs-note-review-open-note",
            name: "Open a note for review",
            callback: () => {
                this.sync();
                this.reviewNextNote();
            },
        });
        this.addCommand({
            id: "srs-note-review-easy",
            name: "Review note as easy",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Easy);
            },
        });
        this.addCommand({
            id: "srs-note-review-good",
            name: "Review note as good",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Good);
            },
        });
        this.addCommand({
            id: "srs-note-review-hard",
            name: "Review note as hard",
            callback: () => {
                const openFile = this.app.workspace.getActiveFile();
                if (openFile && openFile.extension == "md")
                    this.saveReviewResponse(openFile, ReviewResponse.Hard);
            },
        });
        this.addCommand({
            id: "srs-review-flashcards",
            name: "Review flashcards",
            callback: async () => {
                await this.flashcards_sync();
                new FlashcardModal(this.app, this).open();
            },
        });
        this.addSettingTab(new SRSettingTab(this.app, this));
        this.app.workspace.onLayoutReady(() => {
            this.initView();
            setTimeout(() => this.sync(), 2000);
            setTimeout(() => this.flashcards_sync(), 2000);
        });
    }
    onunload() {
        this.app.workspace
            .getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE)
            .forEach((leaf) => leaf.detach());
    }
    async sync() {
        let notes = this.app.vault.getMarkdownFiles();
        lib.reset();
        this.scheduledNotes = [];
        this.easeByPath = {};
        this.newNotes = [];
        this.incomingLinks = {};
        this.pageranks = {};
        this.dueNotesCount = 0;
        let now = Date.now();
        for (let note of notes) {
            if (this.incomingLinks[note.path] == undefined)
                this.incomingLinks[note.path] = [];
            let links = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (let targetPath in links) {
                if (this.incomingLinks[targetPath] == undefined)
                    this.incomingLinks[targetPath] = [];
                // markdown files only
                if (targetPath.split(".").pop().toLowerCase() == "md") {
                    this.incomingLinks[targetPath].push({
                        sourcePath: note.path,
                        linkCount: links[targetPath],
                    });
                    lib.link(note.path, targetPath, links[targetPath]);
                }
            }
            let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
            let frontmatter = fileCachedData.frontmatter || {};
            let tags = obsidian.getAllTags(fileCachedData) || [];
            let shouldIgnore = true;
            for (let tag of tags) {
                if (this.data.settings.tagsToReview.includes(tag)) {
                    shouldIgnore = false;
                    break;
                }
            }
            if (shouldIgnore)
                continue;
            // file has no scheduling information
            if (!(frontmatter.hasOwnProperty("sr-due") &&
                frontmatter.hasOwnProperty("sr-interval") &&
                frontmatter.hasOwnProperty("sr-ease"))) {
                this.newNotes.push(note);
                continue;
            }
            let dueUnix = window
                .moment(frontmatter["sr-due"], [
                "YYYY-MM-DD",
                "DD-MM-YYYY",
                "ddd MMM DD YYYY",
            ])
                .valueOf();
            this.scheduledNotes.push({
                note,
                dueUnix,
            });
            this.easeByPath[note.path] = frontmatter["sr-ease"];
            if (dueUnix <= now)
                this.dueNotesCount++;
        }
        lib.rank(0.85, 0.000001, (node, rank) => {
            this.pageranks[node] = rank * 10000;
        });
        // sort new notes by importance
        this.newNotes = this.newNotes.sort((a, b) => (this.pageranks[b.path] || 0) - (this.pageranks[a.path] || 0));
        // sort scheduled notes by date & within those days, sort them by importance
        this.scheduledNotes = this.scheduledNotes.sort((a, b) => {
            let result = a.dueUnix - b.dueUnix;
            if (result != 0)
                return result;
            return ((this.pageranks[b.note.path] || 0) -
                (this.pageranks[a.note.path] || 0));
        });
        let noteCountText = this.dueNotesCount == 1 ? "note" : "notes";
        let cardCountText = this.dueFlashcardsCount == 1 ? "card" : "cards";
        this.statusBar.setText(`Review: ${this.dueNotesCount} ${noteCountText}, ${this.dueFlashcardsCount} ${cardCountText} due`);
        this.reviewQueueView.redraw();
    }
    async saveReviewResponse(note, response) {
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let frontmatter = fileCachedData.frontmatter || {};
        let tags = obsidian.getAllTags(fileCachedData) || [];
        let shouldIgnore = true;
        for (let tag of tags) {
            if (this.data.settings.tagsToReview.includes(tag)) {
                shouldIgnore = false;
                break;
            }
        }
        if (shouldIgnore) {
            new obsidian.Notice("Please tag the note appropriately for reviewing (in settings).");
            return;
        }
        let fileText = await this.app.vault.read(note);
        let ease, interval;
        // new note
        if (!(frontmatter.hasOwnProperty("sr-due") &&
            frontmatter.hasOwnProperty("sr-interval") &&
            frontmatter.hasOwnProperty("sr-ease"))) {
            let linkTotal = 0, linkPGTotal = 0, totalLinkCount = 0;
            for (let statObj of this.incomingLinks[note.path]) {
                let ease = this.easeByPath[statObj.sourcePath];
                if (ease) {
                    linkTotal +=
                        statObj.linkCount *
                            this.pageranks[statObj.sourcePath] *
                            ease;
                    linkPGTotal +=
                        this.pageranks[statObj.sourcePath] * statObj.linkCount;
                    totalLinkCount += statObj.linkCount;
                }
            }
            let outgoingLinks = this.app.metadataCache.resolvedLinks[note.path] || {};
            for (let linkedFilePath in outgoingLinks) {
                let ease = this.easeByPath[linkedFilePath];
                if (ease) {
                    linkTotal +=
                        outgoingLinks[linkedFilePath] *
                            this.pageranks[linkedFilePath] *
                            ease;
                    linkPGTotal +=
                        this.pageranks[linkedFilePath] *
                            outgoingLinks[linkedFilePath];
                    totalLinkCount += outgoingLinks[linkedFilePath];
                }
            }
            let linkContribution = this.data.settings.maxLinkFactor *
                Math.min(1.0, Math.log(totalLinkCount + 0.5) / Math.log(64));
            ease = Math.round((1.0 - linkContribution) * this.data.settings.baseEase +
                (totalLinkCount > 0
                    ? (linkContribution * linkTotal) / linkPGTotal
                    : linkContribution * this.data.settings.baseEase));
            interval = 1;
        }
        else {
            interval = frontmatter["sr-interval"];
            ease = frontmatter["sr-ease"];
        }
        let schedObj = schedule(response, interval, ease, true, this.data.settings);
        interval = Math.round(schedObj.interval);
        ease = schedObj.ease;
        let due = window.moment(Date.now() + interval * 24 * 3600 * 1000);
        let dueString = due.format("YYYY-MM-DD");
        // check if scheduling info exists
        if (SCHEDULING_INFO_REGEX.test(fileText)) {
            let schedulingInfo = SCHEDULING_INFO_REGEX.exec(fileText);
            fileText = fileText.replace(SCHEDULING_INFO_REGEX, `---\n${schedulingInfo[1]}sr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n${schedulingInfo[5]}---`);
            // new note with existing YAML front matter
        }
        else if (YAML_FRONT_MATTER_REGEX.test(fileText)) {
            let existingYaml = YAML_FRONT_MATTER_REGEX.exec(fileText);
            fileText = fileText.replace(YAML_FRONT_MATTER_REGEX, `---\n${existingYaml[1]}sr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---`);
        }
        else {
            fileText = `---\nsr-due: ${dueString}\nsr-interval: ${interval}\nsr-ease: ${ease}\n---\n\n${fileText}`;
        }
        this.app.vault.modify(note, fileText);
        new obsidian.Notice("Response received.");
        setTimeout(() => {
            this.sync();
            if (this.data.settings.autoNextNote)
                this.reviewNextNote();
        }, 500);
    }
    async reviewNextNote() {
        if (this.dueNotesCount > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * this.dueNotesCount)
                : 0;
            this.app.workspace.activeLeaf.openFile(this.scheduledNotes[index].note);
            return;
        }
        if (this.newNotes.length > 0) {
            let index = this.data.settings.openRandomNote
                ? Math.floor(Math.random() * this.newNotes.length)
                : 0;
            this.app.workspace.activeLeaf.openFile(this.newNotes[index]);
            return;
        }
        new obsidian.Notice("You're done for the day :D.");
    }
    async flashcards_sync() {
        let notes = this.app.vault.getMarkdownFiles();
        this.newFlashcards = {};
        this.newFlashcardsCount = 0;
        this.dueFlashcards = {};
        this.dueFlashcardsCount = 0;
        for (let note of notes) {
            let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
            fileCachedData.frontmatter || {};
            let tags = obsidian.getAllTags(fileCachedData) || [];
            for (let tag of tags) {
                if (this.data.settings.flashcardTags.includes(tag)) {
                    await this.findFlashcards(note, tag);
                    break;
                }
            }
        }
        // sort the deck names
        this.dueFlashcards = Object.keys(this.dueFlashcards)
            .sort()
            .reduce((obj, key) => {
            obj[key] = this.dueFlashcards[key];
            return obj;
        }, {});
        this.newFlashcards = Object.keys(this.newFlashcards)
            .sort()
            .reduce((obj, key) => {
            obj[key] = this.newFlashcards[key];
            return obj;
        }, {});
        let noteCountText = this.dueNotesCount == 1 ? "note" : "notes";
        let cardCountText = this.dueFlashcardsCount == 1 ? "card" : "cards";
        this.statusBar.setText(`Review: ${this.dueNotesCount} ${noteCountText}, ${this.dueFlashcardsCount} ${cardCountText} due`);
    }
    async findFlashcards(note, deck) {
        let fileText = await this.app.vault.read(note);
        let fileCachedData = this.app.metadataCache.getFileCache(note) || {};
        let headings = fileCachedData.headings || [];
        let fileChanged = false;
        if (!this.dueFlashcards.hasOwnProperty(deck)) {
            this.dueFlashcards[deck] = [];
            this.newFlashcards[deck] = [];
        }
        // find all codeblocks
        let codeblocks = [];
        for (let regex of [CODEBLOCK_REGEX, INLINE_CODE_REGEX]) {
            for (let match of fileText.matchAll(regex))
                codeblocks.push([match.index, match.index + match[0].length]);
        }
        let now = Date.now();
        // basic cards
        for (let regex of [this.singlelineCardRegex, this.multilineCardRegex]) {
            let cardType = regex == this.singlelineCardRegex
                ? CardType.SingleLineBasic
                : CardType.MultiLineBasic;
            for (let match of fileText.matchAll(regex)) {
                if (inCodeblock(match.index, match[0].trim().length, codeblocks))
                    continue;
                let cardText = match[0].trim();
                let originalFrontText = match[1].trim();
                let front = await this.fixCardMediaLinks(originalFrontText, note.path);
                let originalBackText = match[2].trim();
                let back = await this.fixCardMediaLinks(originalBackText, note.path);
                let cardObj;
                // flashcard already scheduled
                if (match[3]) {
                    let dueUnix = window
                        .moment(match[3], [
                        "YYYY-MM-DD",
                        "DD-MM-YYYY",
                        "ddd MMM DD YYYY",
                    ])
                        .valueOf();
                    if (dueUnix <= now) {
                        cardObj = {
                            isDue: true,
                            interval: parseInt(match[4]),
                            ease: parseInt(match[5]),
                            note,
                            front,
                            back,
                            cardText,
                            context: "",
                            originalFrontText,
                            originalBackText,
                            cardType,
                        };
                        this.dueFlashcards[deck].push(cardObj);
                        this.dueFlashcardsCount++;
                    }
                    else
                        continue;
                }
                else {
                    cardObj = {
                        isDue: false,
                        note,
                        front,
                        back,
                        cardText,
                        context: "",
                        originalFrontText,
                        originalBackText,
                        cardType,
                    };
                    this.newFlashcards[deck].push(cardObj);
                    this.newFlashcardsCount++;
                }
                if (getSetting("showContextInCards", this.data.settings))
                    addContextToCard(cardObj, match.index, headings);
            }
        }
        // cloze deletion cards
        if (!getSetting("disableClozeCards", this.data.settings)) {
            for (let match of fileText.matchAll(CLOZE_CARD_DETECTOR)) {
                match[0] = match[0].trim();
                let cardText = match[0];
                let deletions = [];
                for (let m of cardText.matchAll(CLOZE_DELETIONS_EXTRACTOR)) {
                    if (inCodeblock(match.index + m.index, m[0].trim().length, codeblocks))
                        continue;
                    deletions.push(m);
                }
                let scheduling = [
                    ...cardText.matchAll(CLOZE_SCHEDULING_EXTRACTOR),
                ];
                // we have some extra scheduling dates to delete
                if (scheduling.length > deletions.length) {
                    let idxSched = cardText.lastIndexOf("<!--SR:") + 7;
                    let newCardText = cardText.substring(0, idxSched);
                    for (let i = 0; i < deletions.length; i++)
                        newCardText += `!${scheduling[i][1]},${scheduling[i][2]},${scheduling[i][3]}`;
                    newCardText += "-->\n";
                    let replacementRegex = new RegExp(escapeRegexString(cardText), "gm");
                    fileText = fileText.replace(replacementRegex, newCardText);
                    fileChanged = true;
                }
                let relatedCards = [];
                for (let i = 0; i < deletions.length; i++) {
                    let cardObj;
                    let deletionStart = deletions[i].index;
                    let deletionEnd = deletionStart + deletions[i][0].length;
                    let front = cardText.substring(0, deletionStart) +
                        "<span style='color:#2196f3'>[...]</span>" +
                        cardText.substring(deletionEnd);
                    front = (await this.fixCardMediaLinks(front, note.path)).replace(/==/gm, "");
                    let back = cardText.substring(0, deletionStart) +
                        "<span style='color:#2196f3'>" +
                        cardText.substring(deletionStart, deletionEnd) +
                        "</span>" +
                        cardText.substring(deletionEnd);
                    back = (await this.fixCardMediaLinks(back, note.path)).replace(/==/gm, "");
                    // card deletion scheduled
                    if (i < scheduling.length) {
                        let dueUnix = window
                            .moment(scheduling[i][1], [
                            "YYYY-MM-DD",
                            "DD-MM-YYYY",
                        ])
                            .valueOf();
                        if (dueUnix <= now) {
                            cardObj = {
                                isDue: true,
                                interval: parseInt(scheduling[i][2]),
                                ease: parseInt(scheduling[i][3]),
                                note,
                                front,
                                back,
                                cardText: match[0],
                                context: "",
                                originalFrontText: "",
                                originalBackText: "",
                                cardType: CardType.Cloze,
                                subCardIdx: i,
                                relatedCards,
                            };
                            this.dueFlashcards[deck].push(cardObj);
                            this.dueFlashcardsCount++;
                        }
                        else
                            continue;
                    }
                    else {
                        // new card
                        cardObj = {
                            isDue: false,
                            note,
                            front,
                            back,
                            cardText: match[0],
                            context: "",
                            originalFrontText: "",
                            originalBackText: "",
                            cardType: CardType.Cloze,
                            subCardIdx: i,
                            relatedCards,
                        };
                        this.newFlashcards[deck].push(cardObj);
                        this.newFlashcardsCount++;
                    }
                    relatedCards.push(cardObj);
                    if (getSetting("showContextInCards", this.data.settings))
                        addContextToCard(cardObj, match.index, headings);
                }
            }
        }
        if (fileChanged)
            await this.app.vault.modify(note, fileText);
    }
    async fixCardMediaLinks(cardText, filePath) {
        for (let regex of [WIKILINK_MEDIA_REGEX, MARKDOWN_LINK_MEDIA_REGEX]) {
            cardText = cardText.replace(regex, (match, imagePath) => {
                let fullImagePath = this.app.metadataCache.getFirstLinkpathDest(decodeURIComponent(imagePath), filePath).path;
                return ('<img src="' +
                    this.app.vault.adapter.getResourcePath(fullImagePath) +
                    '" />');
            });
        }
        return cardText;
    }
    async loadPluginData() {
        this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
    }
    async savePluginData() {
        await this.saveData(this.data);
    }
    initView() {
        if (this.app.workspace.getLeavesOfType(REVIEW_QUEUE_VIEW_TYPE).length) {
            return;
        }
        this.app.workspace.getRightLeaf(false).setViewState({
            type: REVIEW_QUEUE_VIEW_TYPE,
            active: true,
        });
    }
}
function addContextToCard(cardObj, cardOffset, headings) {
    let stack = [];
    for (let heading of headings) {
        if (heading.position.start.offset > cardOffset)
            break;
        while (stack.length > 0 &&
            stack[stack.length - 1].level >= heading.level)
            stack.pop();
        stack.push(heading);
    }
    for (let headingObj of stack)
        cardObj.context += headingObj.heading + " > ";
    cardObj.context = cardObj.context.slice(0, -3);
}
function inCodeblock(matchStart, matchLength, codeblocks) {
    for (let codeblock of codeblocks) {
        if (matchStart >= codeblock[0] &&
            matchStart + matchLength <= codeblock[1])
            return true;
    }
    return false;
}

module.exports = SRPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3BhZ2VyYW5rLmpzL2xpYi9pbmRleC5qcyIsInNyYy91dGlscy50cyIsInNyYy9zZXR0aW5ncy50cyIsInNyYy90eXBlcy50cyIsInNyYy9zY2hlZC50cyIsInNyYy9jb25zdGFudHMudHMiLCJzcmMvZmxhc2hjYXJkLW1vZGFsLnRzIiwic3JjL3NpZGViYXIudHMiLCJzcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGZvck93bihvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCh0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JykgJiYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKGtleSwgb2JqZWN0W2tleV0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHtcbiAgICAgICAgY291bnQ6IDAsXG4gICAgICAgIGVkZ2VzOiB7fSxcbiAgICAgICAgbm9kZXM6IHt9XG4gICAgfTtcblxuICAgIHNlbGYubGluayA9IGZ1bmN0aW9uIChzb3VyY2UsIHRhcmdldCwgd2VpZ2h0KSB7XG4gICAgICAgIGlmICgoaXNGaW5pdGUod2VpZ2h0KSAhPT0gdHJ1ZSkgfHwgKHdlaWdodCA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgIHdlaWdodCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHdlaWdodCA9IHBhcnNlRmxvYXQod2VpZ2h0KTtcblxuICAgICAgICBpZiAoc2VsZi5ub2Rlcy5oYXNPd25Qcm9wZXJ0eShzb3VyY2UpICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBzZWxmLmNvdW50Kys7XG4gICAgICAgICAgICBzZWxmLm5vZGVzW3NvdXJjZV0gPSB7XG4gICAgICAgICAgICAgICAgd2VpZ2h0OiAwLFxuICAgICAgICAgICAgICAgIG91dGJvdW5kOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5ub2Rlc1tzb3VyY2VdLm91dGJvdW5kICs9IHdlaWdodDtcblxuICAgICAgICBpZiAoc2VsZi5ub2Rlcy5oYXNPd25Qcm9wZXJ0eSh0YXJnZXQpICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBzZWxmLmNvdW50Kys7XG4gICAgICAgICAgICBzZWxmLm5vZGVzW3RhcmdldF0gPSB7XG4gICAgICAgICAgICAgICAgd2VpZ2h0OiAwLFxuICAgICAgICAgICAgICAgIG91dGJvdW5kOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGYuZWRnZXMuaGFzT3duUHJvcGVydHkoc291cmNlKSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgc2VsZi5lZGdlc1tzb3VyY2VdID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5lZGdlc1tzb3VyY2VdLmhhc093blByb3BlcnR5KHRhcmdldCkgIT09IHRydWUpIHtcbiAgICAgICAgICAgIHNlbGYuZWRnZXNbc291cmNlXVt0YXJnZXRdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuZWRnZXNbc291cmNlXVt0YXJnZXRdICs9IHdlaWdodDtcbiAgICB9O1xuXG4gICAgc2VsZi5yYW5rID0gZnVuY3Rpb24gKGFscGhhLCBlcHNpbG9uLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZGVsdGEgPSAxLFxuICAgICAgICAgICAgaW52ZXJzZSA9IDEgLyBzZWxmLmNvdW50O1xuXG4gICAgICAgIGZvck93bihzZWxmLmVkZ2VzLCBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5ub2Rlc1tzb3VyY2VdLm91dGJvdW5kID4gMCkge1xuICAgICAgICAgICAgICAgIGZvck93bihzZWxmLmVkZ2VzW3NvdXJjZV0sIGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lZGdlc1tzb3VyY2VdW3RhcmdldF0gLz0gc2VsZi5ub2Rlc1tzb3VyY2VdLm91dGJvdW5kO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBmb3JPd24oc2VsZi5ub2RlcywgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgc2VsZi5ub2Rlc1trZXldLndlaWdodCA9IGludmVyc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdoaWxlIChkZWx0YSA+IGVwc2lsb24pIHtcbiAgICAgICAgICAgIHZhciBsZWFrID0gMCxcbiAgICAgICAgICAgICAgICBub2RlcyA9IHt9O1xuXG4gICAgICAgICAgICBmb3JPd24oc2VsZi5ub2RlcywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBub2Rlc1trZXldID0gdmFsdWUud2VpZ2h0O1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLm91dGJvdW5kID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlYWsgKz0gdmFsdWUud2VpZ2h0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYubm9kZXNba2V5XS53ZWlnaHQgPSAwO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxlYWsgKj0gYWxwaGE7XG5cbiAgICAgICAgICAgIGZvck93bihzZWxmLm5vZGVzLCBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgZm9yT3duKHNlbGYuZWRnZXNbc291cmNlXSwgZnVuY3Rpb24gKHRhcmdldCwgd2VpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubm9kZXNbdGFyZ2V0XS53ZWlnaHQgKz0gYWxwaGEgKiBub2Rlc1tzb3VyY2VdICogd2VpZ2h0O1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5ub2Rlc1tzb3VyY2VdLndlaWdodCArPSAoMSAtIGFscGhhKSAqIGludmVyc2UgKyBsZWFrICogaW52ZXJzZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBkZWx0YSA9IDA7XG5cbiAgICAgICAgICAgIGZvck93bihzZWxmLm5vZGVzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGRlbHRhICs9IE1hdGguYWJzKHZhbHVlLndlaWdodCAtIG5vZGVzW2tleV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JPd24oc2VsZi5ub2RlcywgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGtleSwgc2VsZi5ub2Rlc1trZXldLndlaWdodCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmNvdW50ID0gMDtcbiAgICAgICAgc2VsZi5lZGdlcyA9IHt9O1xuICAgICAgICBzZWxmLm5vZGVzID0ge307XG4gICAgfTtcblxuICAgIHJldHVybiBzZWxmO1xufSkoKTtcbiIsIi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82OTY5NDg2LzEyOTM4Nzk3XG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlUmVnZXhTdHJpbmcodGV4dDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRleHQucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xufVxuIiwiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBBcHAgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIFNSUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IFNSU2V0dGluZ3MgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgZXNjYXBlUmVnZXhTdHJpbmcgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogU1JTZXR0aW5ncyA9IHtcbiAgICAvLyBmbGFzaGNhcmRzXG4gICAgZmxhc2hjYXJkVGFnczogW1wiI2ZsYXNoY2FyZHNcIl0sXG4gICAgY2FyZENvbW1lbnRPblNhbWVMaW5lOiBmYWxzZSxcbiAgICBidXJ5UmVsYXRlZENhcmRzOiBmYWxzZSxcbiAgICBzaG93Q29udGV4dEluQ2FyZHM6IHRydWUsXG4gICAgZGlzYWJsZUNsb3plQ2FyZHM6IGZhbHNlLFxuICAgIGRpc2FibGVTaW5nbGVsaW5lQ2FyZHM6IGZhbHNlLFxuICAgIHNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yOiBcIjo6XCIsXG4gICAgZGlzYWJsZVNpbmdsZWxpbmVSZXZlcnNlZENhcmRzOiBmYWxzZSxcbiAgICBzaW5nbGVsaW5lUmV2ZXJzZWRDYXJkU2VwYXJhdG9yOiBcIjo6OlwiLFxuICAgIGRpc2FibGVNdWx0aWxpbmVDYXJkczogZmFsc2UsXG4gICAgbXVsdGlsaW5lQ2FyZFNlcGFyYXRvcjogXCI/XCIsXG4gICAgZGlzYWJsZU11bHRpbGluZVJldmVyc2VkQ2FyZHM6IGZhbHNlLFxuICAgIG11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcjogXCI/P1wiLFxuICAgIC8vIG5vdGVzXG4gICAgdGFnc1RvUmV2aWV3OiBbXCIjcmV2aWV3XCJdLFxuICAgIG9wZW5SYW5kb21Ob3RlOiBmYWxzZSxcbiAgICBhdXRvTmV4dE5vdGU6IGZhbHNlLFxuICAgIGRpc2FibGVGaWxlTWVudVJldmlld09wdGlvbnM6IGZhbHNlLFxuICAgIG1heE5EYXlzTm90ZXNSZXZpZXdRdWV1ZTogMzY1LFxuICAgIC8vIGFsZ29yaXRobVxuICAgIGJhc2VFYXNlOiAyNTAsXG4gICAgbGFwc2VzSW50ZXJ2YWxDaGFuZ2U6IDAuNSxcbiAgICBlYXN5Qm9udXM6IDEuMyxcbiAgICBtYXhpbXVtSW50ZXJ2YWw6IDM2NTI1LFxuICAgIG1heExpbmtGYWN0b3I6IDEuMCxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXR0aW5nKFxuICAgIHNldHRpbmdOYW1lOiBrZXlvZiBTUlNldHRpbmdzLFxuICAgIHNldHRpbmdzT2JqOiBTUlNldHRpbmdzXG4pOiBhbnkge1xuICAgIGxldCB2YWx1ZTogYW55ID0gc2V0dGluZ3NPYmpbc2V0dGluZ05hbWVdO1xuICAgIHZhbHVlID8/PSBERUZBVUxUX1NFVFRJTkdTW3NldHRpbmdOYW1lXTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZ21leWVycy9vYnNpZGlhbi1rYW5iYW4vYmxvYi9tYWluL3NyYy9TZXR0aW5ncy50c1xubGV0IGFwcGx5RGVib3VuY2VUaW1lcjogbnVtYmVyID0gMDtcbmZ1bmN0aW9uIGFwcGx5U2V0dGluZ3NVcGRhdGUoY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgY2xlYXJUaW1lb3V0KGFwcGx5RGVib3VuY2VUaW1lcik7XG4gICAgYXBwbHlEZWJvdW5jZVRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDUxMik7XG59XG5cbmV4cG9ydCBjbGFzcyBTUlNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgICBwcml2YXRlIHBsdWdpbjogU1JQbHVnaW47XG5cbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBTUlBsdWdpbikge1xuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgIH1cblxuICAgIGRpc3BsYXkoKSB7XG4gICAgICAgIGxldCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRGl2KCkuaW5uZXJIVE1MID1cbiAgICAgICAgICAgIFwiPGgyPlNwYWNlZCBSZXBldGl0aW9uIFBsdWdpbiAtIFNldHRpbmdzPC9oMj5cIjtcblxuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoKS5pbm5lckhUTUwgPVxuICAgICAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uLCBjaGVjayB0aGUgPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9zdDN2M25tdy9vYnNpZGlhbi1zcGFjZWQtcmVwZXRpdGlvbi93aWtpXCI+d2lraTwvYT4uJztcblxuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoKS5pbm5lckhUTUwgPSBcIjxoMz5GbGFzaGNhcmRzPC9oMz5cIjtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRmxhc2hjYXJkIHRhZ3NcIilcbiAgICAgICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgICAgICAgIFwiRW50ZXIgdGFncyBzZXBhcmF0ZWQgYnkgc3BhY2VzIGkuZS4gI2ZsYXNoY2FyZHMgI2RlY2syICNkZWNrMy5cIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PlxuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7Z2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZsYXNoY2FyZFRhZ3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICApLmpvaW4oXCIgXCIpfWBcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVNldHRpbmdzVXBkYXRlKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmZsYXNoY2FyZFRhZ3MgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFxuICAgICAgICAgICAgICAgIFwiU2F2ZSBzY2hlZHVsaW5nIGNvbW1lbnQgb24gdGhlIHNhbWUgbGluZSBhcyB0aGUgZmxhc2hjYXJkJ3MgbGFzdCBsaW5lP1wiXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICAgICAgICBcIlR1cm5pbmcgdGhpcyBvbiB3aWxsIG1ha2UgdGhlIEhUTUwgY29tbWVudHMgbm90IGJyZWFrIGxpc3QgZm9ybWF0dGluZy5cIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICAgICAgICAgIHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRTZXR0aW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiY2FyZENvbW1lbnRPblNhbWVMaW5lXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuY2FyZENvbW1lbnRPblNhbWVMaW5lID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiQnVyeSByZWxhdGVkIGNhcmRzIHVudGlsIHRoZSBuZXh0IHJldmlldyBzZXNzaW9uP1wiKVxuICAgICAgICAgICAgLnNldERlc2MoXCJUaGlzIGFwcGxpZXMgdG8gb3RoZXIgY2xvemUgZGVsZXRpb25zIGluIGNsb3plIGNhcmRzLlwiKVxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICAgICAgICAgIHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRTZXR0aW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYnVyeVJlbGF0ZWRDYXJkc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmJ1cnlSZWxhdGVkQ2FyZHMgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoXCJTaG93IGNvbnRleHQgaW4gY2FyZHM/XCIpXG4gICAgICAgICAgICAuc2V0RGVzYyhcImkuZS4gVGl0bGUgPiBIZWFkaW5nIDEgPiBTdWJoZWFkaW5nID4gLi4uID4gU3ViaGVhZGluZ1wiKVxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICAgICAgICAgIHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRTZXR0aW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic2hvd0NvbnRleHRJbkNhcmRzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3Muc2hvd0NvbnRleHRJbkNhcmRzID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRGlzYWJsZSBjbG96ZSBjYXJkcz9cIilcbiAgICAgICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgICAgICAgIFwiSWYgeW91J3JlIG5vdCBjdXJyZW50bHkgdXNpbmcgJ2VtICYgd291bGQgbGlrZSB0aGUgcGx1Z2luIHRvIHJ1biBhIHRhZCBmYXN0ZXIuXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgICAgICAgICB0b2dnbGVcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRpc2FibGVDbG96ZUNhcmRzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZGlzYWJsZUNsb3plQ2FyZHMgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoXCJTZXBhcmF0b3IgZm9yIGlubGluZSBmbGFzaGNhcmRzXCIpXG4gICAgICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICAgICAgICBcIk5vdGUgdGhhdCBhZnRlciBjaGFuZ2luZyB0aGlzIHlvdSBoYXZlIHRvIG1hbnVhbGx5IGVkaXQgYW55IGZsYXNoY2FyZHMgeW91IGFscmVhZHkgaGF2ZS5cIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBgJHtnZXRTZXR0aW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwic2luZ2xlbGluZUNhcmRTZXBhcmF0b3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICApfWBcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVNldHRpbmdzVXBkYXRlKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLnNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zaW5nbGVsaW5lQ2FyZFJlZ2V4ID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYF4oLispJHtlc2NhcGVSZWdleFN0cmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9KC4rPylcXFxcbj8oPzo8IS0tU1I6KC4rKSwoXFxcXGQrKSwoXFxcXGQrKS0tPnwkKWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ21cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZXNldCB0byBkZWZhdWx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3Muc2luZ2xlbGluZUNhcmRTZXBhcmF0b3IgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERFRkFVTFRfU0VUVElOR1Muc2luZ2xlbGluZUNhcmRTZXBhcmF0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZShcIlNlcGFyYXRvciBmb3IgbXVsdGlsaW5lIGZsYXNoY2FyZHNcIilcbiAgICAgICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgICAgICAgIFwiTm90ZSB0aGF0IGFmdGVyIGNoYW5naW5nIHRoaXMgeW91IGhhdmUgdG8gbWFudWFsbHkgZWRpdCBhbnkgZmxhc2hjYXJkcyB5b3UgYWxyZWFkeSBoYXZlLlwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke2dldFNldHRpbmcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJtdWx0aWxpbmVDYXJkU2VwYXJhdG9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgKX1gXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tdWx0aWxpbmVDYXJkU2VwYXJhdG9yID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5tdWx0aWxpbmVDYXJkUmVnZXggPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgXigoPzouK1xcXFxuKSspJHtlc2NhcGVSZWdleFN0cmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XFxcXG4oKD86Lis/XFxcXG4/KSs/KSg/OjwhLS1TUjooLispLChcXFxcZCspLChcXFxcZCspLS0+fCQpYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJnbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJyZXNldFwiKVxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIlJlc2V0IHRvIGRlZmF1bHRcIilcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tdWx0aWxpbmVDYXJkU2VwYXJhdG9yID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLm11bHRpbGluZUNhcmRTZXBhcmF0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRGl2KCkuaW5uZXJIVE1MID0gXCI8aDM+Tm90ZXM8L2gzPlwiO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoXCJUYWdzIHRvIHJldmlld1wiKVxuICAgICAgICAgICAgLnNldERlc2MoXCJFbnRlciB0YWdzIHNlcGFyYXRlZCBieSBzcGFjZXMgaS5lLiAjcmV2aWV3ICN0YWcyICN0YWczLlwiKVxuICAgICAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PlxuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7Z2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRhZ3NUb1Jldmlld1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICkuam9pbihcIiBcIil9YFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5U2V0dGluZ3NVcGRhdGUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MudGFnc1RvUmV2aWV3ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZShcIk9wZW4gYSByYW5kb20gbm90ZSBmb3IgcmV2aWV3XCIpXG4gICAgICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICAgICAgICBcIldoZW4geW91IHR1cm4gdGhpcyBvZmYsIG5vdGVzIGFyZSBvcmRlcmVkIGJ5IGltcG9ydGFuY2UgKFBhZ2VSYW5rKS5cIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICAgICAgICAgIHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRTZXR0aW5nKFwib3BlblJhbmRvbU5vdGVcIiwgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm9wZW5SYW5kb21Ob3RlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiT3BlbiBuZXh0IG5vdGUgYXV0b21hdGljYWxseSBhZnRlciBhIHJldmlld1wiKVxuICAgICAgICAgICAgLnNldERlc2MoXCJGb3IgZmFzdGVyIHJldmlld3MuXCIpXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldFNldHRpbmcoXCJhdXRvTmV4dE5vdGVcIiwgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmF1dG9OZXh0Tm90ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZShcbiAgICAgICAgICAgICAgICBcIkRpc2FibGUgcmV2aWV3IG9wdGlvbnMgaW4gdGhlIGZpbGUgbWVudSBpLmUuIFJldmlldzogRWFzeSBHb29kIEhhcmRcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgICAgICAgXCJBZnRlciBkaXNhYmxpbmcsIHlvdSBjYW4gcmV2aWV3IHVzaW5nIHRoZSBjb21tYW5kIGhvdGtleXMuIFJlbG9hZCBPYnNpZGlhbiBhZnRlciBjaGFuZ2luZyB0aGlzLlwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldFNldHRpbmcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkaXNhYmxlRmlsZU1lbnVSZXZpZXdPcHRpb25zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZGlzYWJsZUZpbGVNZW51UmV2aWV3T3B0aW9ucyA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiTWF4aW11bSBudW1iZXIgb2YgZGF5cyB0byBkaXNwbGF5IG9uIHJpZ2h0IHBhbmVsXCIpXG4gICAgICAgICAgICAuc2V0RGVzYyhcIlJlZHVjZSB0aGlzIGZvciBhIGNsZWFuZXIgaW50ZXJmYWNlLlwiKVxuICAgICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBgJHtnZXRTZXR0aW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibWF4TkRheXNOb3Rlc1Jldmlld1F1ZXVlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAgICAgKX1gXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVZhbHVlOiBudW1iZXIgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNOYU4obnVtVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1WYWx1ZSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGUgbnVtYmVyIG9mIGRheXMgbXVzdCBiZSBhdCBsZWFzdCAxLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHt0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heE5EYXlzTm90ZXNSZXZpZXdRdWV1ZX1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tYXhORGF5c05vdGVzUmV2aWV3UXVldWUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlBsZWFzZSBwcm92aWRlIGEgdmFsaWQgbnVtYmVyLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZXNldCB0byBkZWZhdWx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4TkRheXNOb3Rlc1Jldmlld1F1ZXVlID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLm1heE5EYXlzTm90ZXNSZXZpZXdRdWV1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVEaXYoKS5pbm5lckhUTUwgPSBcIjxoMz5BbGdvcml0aG08L2gzPlwiO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZURpdigpLmlubmVySFRNTCA9XG4gICAgICAgICAgICAnRm9yIG1vcmUgaW5mb3JtYXRpb24sIGNoZWNrIHRoZSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL3N0M3Yzbm13L29ic2lkaWFuLXNwYWNlZC1yZXBldGl0aW9uL3dpa2kvU3BhY2VkLVJlcGV0aXRpb24tQWxnb3JpdGhtXCI+YWxnb3JpdGhtIGltcGxlbWVudGF0aW9uPC9hPi4nO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoXCJCYXNlIGVhc2VcIilcbiAgICAgICAgICAgIC5zZXREZXNjKFwibWluaW11bSA9IDEzMCwgcHJlZmVycmFibHkgYXBwcm94aW1hdGVseSAyNTAuXCIpXG4gICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGAke2dldFNldHRpbmcoXCJiYXNlRWFzZVwiLCB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzKX1gXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBwbHlTZXR0aW5nc1VwZGF0ZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVZhbHVlOiBudW1iZXIgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNOYU4obnVtVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1WYWx1ZSA8IDEzMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRoZSBiYXNlIGVhc2UgbXVzdCBiZSBhdCBsZWFzdCAxMzAuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3RoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYmFzZUVhc2V9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYmFzZUVhc2UgPSBudW1WYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiUGxlYXNlIHByb3ZpZGUgYSB2YWxpZCBudW1iZXIuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJyZXNldFwiKVxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIlJlc2V0IHRvIGRlZmF1bHRcIilcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5iYXNlRWFzZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUy5iYXNlRWFzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiSW50ZXJ2YWwgY2hhbmdlIHdoZW4geW91IHJldmlldyBhIGZsYXNoY2FyZC9ub3RlIGFzIGhhcmRcIilcbiAgICAgICAgICAgIC5zZXREZXNjKFwibmV3SW50ZXJ2YWwgPSBvbGRJbnRlcnZhbCAqIGludGVydmFsQ2hhbmdlIC8gMTAwLlwiKVxuICAgICAgICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PlxuICAgICAgICAgICAgICAgIHNsaWRlclxuICAgICAgICAgICAgICAgICAgICAuc2V0TGltaXRzKDEsIDk5LCAxKVxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRTZXR0aW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibGFwc2VzSW50ZXJ2YWxDaGFuZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgICAgICApICogMTAwXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLmxhcHNlc0ludGVydmFsQ2hhbmdlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChidXR0b24pID0+IHtcbiAgICAgICAgICAgICAgICBidXR0b25cbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJyZXNldFwiKVxuICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIlJlc2V0IHRvIGRlZmF1bHRcIilcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5sYXBzZXNJbnRlcnZhbENoYW5nZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUy5sYXBzZXNJbnRlcnZhbENoYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRWFzeSBib251c1wiKVxuICAgICAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgICAgICAgXCJUaGUgZWFzeSBib251cyBhbGxvd3MgeW91IHRvIHNldCB0aGUgZGlmZmVyZW5jZSBpbiBpbnRlcnZhbHMgYmV0d2VlbiBhbnN3ZXJpbmcgR29vZCBhbmQgRWFzeSBvbiBhIGZsYXNoY2FyZC9ub3RlIChtaW5pbXVtID0gMTAwJSkuXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0U2V0dGluZyhcImVhc3lCb251c1wiLCB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5U2V0dGluZ3NVcGRhdGUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1WYWx1ZTogbnVtYmVyID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlKSAvIDEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKG51bVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtVmFsdWUgPCAxLjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGUgZWFzeSBib251cyBtdXN0IGJlIGF0IGxlYXN0IDEwMC5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lYXN5Qm9udXMgKiAxMDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZWFzeUJvbnVzID0gbnVtVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZShcIlBsZWFzZSBwcm92aWRlIGEgdmFsaWQgbnVtYmVyLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZXNldCB0byBkZWZhdWx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuZWFzeUJvbnVzID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTLmVhc3lCb251cztcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVQbHVnaW5EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKFwiTWF4aW11bSBJbnRlcnZhbFwiKVxuICAgICAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgICAgICAgXCJBbGxvd3MgeW91IHRvIHBsYWNlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBpbnRlcnZhbCAoZGVmYXVsdCA9IDEwMCB5ZWFycykuXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7Z2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1heGltdW1JbnRlcnZhbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICl9YFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5U2V0dGluZ3NVcGRhdGUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1WYWx1ZTogbnVtYmVyID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKG51bVZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtVmFsdWUgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhlIG1heGltdW0gaW50ZXJ2YWwgbXVzdCBiZSBhdCBsZWFzdCAxIGRheS5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQuc2V0VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7dGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5tYXhpbXVtSW50ZXJ2YWx9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4aW11bUludGVydmFsID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJQbGVhc2UgcHJvdmlkZSBhIHZhbGlkIG51bWJlci5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGJ1dHRvbikgPT4ge1xuICAgICAgICAgICAgICAgIGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInJlc2V0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiUmVzZXQgdG8gZGVmYXVsdFwiKVxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzLm1heGltdW1JbnRlcnZhbCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUy5tYXhpbXVtSW50ZXJ2YWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlUGx1Z2luRGF0YSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZShcIk1heGltdW0gbGluayBjb250cmlidXRpb25cIilcbiAgICAgICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgICAgICAgIFwiTWF4aW11bSBjb250cmlidXRpb24gb2YgdGhlIHdlaWdodGVkIGVhc2Ugb2YgbGlua2VkIG5vdGVzIHRvIHRoZSBpbml0aWFsIGVhc2UuXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRTbGlkZXIoKHNsaWRlcikgPT5cbiAgICAgICAgICAgICAgICBzbGlkZXJcbiAgICAgICAgICAgICAgICAgICAgLnNldExpbWl0cygwLCAxMDAsIDEpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldFNldHRpbmcoXCJtYXhMaW5rRmFjdG9yXCIsIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MpICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMDBcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4TGlua0ZhY3RvciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnV0dG9uKSA9PiB7XG4gICAgICAgICAgICAgICAgYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwicmVzZXRcIilcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZXNldCB0byBkZWZhdWx0XCIpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MubWF4TGlua0ZhY3RvciA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUy5tYXhMaW5rRmFjdG9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVBsdWdpbkRhdGEoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU1JTZXR0aW5ncyB7XG4gICAgLy8gZmxhc2hjYXJkc1xuICAgIGZsYXNoY2FyZFRhZ3M6IHN0cmluZ1tdO1xuICAgIGNhcmRDb21tZW50T25TYW1lTGluZTogYm9vbGVhbjtcbiAgICBidXJ5UmVsYXRlZENhcmRzOiBib29sZWFuO1xuICAgIHNob3dDb250ZXh0SW5DYXJkczogYm9vbGVhbjtcbiAgICBkaXNhYmxlQ2xvemVDYXJkczogYm9vbGVhbjtcbiAgICBkaXNhYmxlU2luZ2xlbGluZUNhcmRzOiBib29sZWFuO1xuICAgIHNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yOiBzdHJpbmc7XG4gICAgZGlzYWJsZVNpbmdsZWxpbmVSZXZlcnNlZENhcmRzOiBib29sZWFuO1xuICAgIHNpbmdsZWxpbmVSZXZlcnNlZENhcmRTZXBhcmF0b3I6IHN0cmluZztcbiAgICBkaXNhYmxlTXVsdGlsaW5lQ2FyZHM6IGJvb2xlYW47XG4gICAgbXVsdGlsaW5lQ2FyZFNlcGFyYXRvcjogc3RyaW5nO1xuICAgIGRpc2FibGVNdWx0aWxpbmVSZXZlcnNlZENhcmRzOiBib29sZWFuO1xuICAgIG11bHRpbGluZVJldmVyc2VkQ2FyZFNlcGFyYXRvcjogc3RyaW5nO1xuICAgIC8vIG5vdGVzXG4gICAgdGFnc1RvUmV2aWV3OiBzdHJpbmdbXTtcbiAgICBvcGVuUmFuZG9tTm90ZTogYm9vbGVhbjtcbiAgICBhdXRvTmV4dE5vdGU6IGJvb2xlYW47XG4gICAgZGlzYWJsZUZpbGVNZW51UmV2aWV3T3B0aW9uczogYm9vbGVhbjtcbiAgICBtYXhORGF5c05vdGVzUmV2aWV3UXVldWU6IG51bWJlcjtcbiAgICAvLyBhbGdvcml0aG1cbiAgICBiYXNlRWFzZTogbnVtYmVyO1xuICAgIGxhcHNlc0ludGVydmFsQ2hhbmdlOiBudW1iZXI7XG4gICAgZWFzeUJvbnVzOiBudW1iZXI7XG4gICAgbWF4aW11bUludGVydmFsOiBudW1iZXI7XG4gICAgbWF4TGlua0ZhY3RvcjogbnVtYmVyO1xufVxuXG5leHBvcnQgZW51bSBSZXZpZXdSZXNwb25zZSB7XG4gICAgRWFzeSxcbiAgICBHb29kLFxuICAgIEhhcmQsXG4gICAgUmVzZXQsXG59XG5cbi8vIE5vdGVzXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NoZWROb3RlIHtcbiAgICBub3RlOiBURmlsZTtcbiAgICBkdWVVbml4OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlua1N0YXQge1xuICAgIHNvdXJjZVBhdGg6IHN0cmluZztcbiAgICBsaW5rQ291bnQ6IG51bWJlcjtcbn1cblxuLy8gRmxhc2hjYXJkc1xuXG5leHBvcnQgaW50ZXJmYWNlIENhcmQge1xuICAgIC8vIHNjaGVkdWxpbmdcbiAgICBpc0R1ZTogYm9vbGVhbjtcbiAgICBpbnRlcnZhbD86IG51bWJlcjtcbiAgICBlYXNlPzogbnVtYmVyO1xuICAgIC8vIG5vdGVcbiAgICBub3RlOiBURmlsZTtcbiAgICAvLyB2aXN1YWxzXG4gICAgZnJvbnQ6IHN0cmluZztcbiAgICBiYWNrOiBzdHJpbmc7XG4gICAgY2FyZFRleHQ6IHN0cmluZztcbiAgICBjb250ZXh0OiBzdHJpbmc7XG4gICAgb3JpZ2luYWxGcm9udFRleHQ6IHN0cmluZztcbiAgICBvcmlnaW5hbEJhY2tUZXh0OiBzdHJpbmc7XG4gICAgLy8gdHlwZXNcbiAgICBjYXJkVHlwZTogQ2FyZFR5cGU7XG4gICAgLy8gc3R1ZmYgZm9yIGNhcmRzIHdpdGggc3ViLWNhcmRzXG4gICAgc3ViQ2FyZElkeD86IG51bWJlcjtcbiAgICByZWxhdGVkQ2FyZHM/OiBDYXJkW107XG59XG5cbmV4cG9ydCBlbnVtIENhcmRUeXBlIHtcbiAgICBTaW5nbGVMaW5lQmFzaWMsXG4gICAgTXVsdGlMaW5lQmFzaWMsXG4gICAgQ2xvemUsXG59XG5cbmV4cG9ydCBlbnVtIEZsYXNoY2FyZE1vZGFsTW9kZSB7XG4gICAgRGVja3NMaXN0LFxuICAgIEZyb250LFxuICAgIEJhY2ssXG4gICAgQ2xvc2VkLFxufVxuIiwiaW1wb3J0IHsgUmV2aWV3UmVzcG9uc2UsIFNSU2V0dGluZ3MgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgZ2V0U2V0dGluZyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZShcbiAgICByZXNwb25zZTogUmV2aWV3UmVzcG9uc2UsXG4gICAgaW50ZXJ2YWw6IG51bWJlcixcbiAgICBlYXNlOiBudW1iZXIsXG4gICAgZnV6ejogYm9vbGVhbixcbiAgICBzZXR0aW5nc09iajogU1JTZXR0aW5nc1xuKSB7XG4gICAgbGV0IGxhcHNlc0ludGVydmFsQ2hhbmdlOiBudW1iZXIgPSBnZXRTZXR0aW5nKFxuICAgICAgICBcImxhcHNlc0ludGVydmFsQ2hhbmdlXCIsXG4gICAgICAgIHNldHRpbmdzT2JqXG4gICAgKTtcbiAgICBsZXQgZWFzeUJvbnVzOiBudW1iZXIgPSBnZXRTZXR0aW5nKFwiZWFzeUJvbnVzXCIsIHNldHRpbmdzT2JqKTtcbiAgICBsZXQgbWF4aW11bUludGVydmFsOiBudW1iZXIgPSBnZXRTZXR0aW5nKFwibWF4aW11bUludGVydmFsXCIsIHNldHRpbmdzT2JqKTtcblxuICAgIGlmIChyZXNwb25zZSAhPSBSZXZpZXdSZXNwb25zZS5Hb29kKSB7XG4gICAgICAgIGVhc2UgPVxuICAgICAgICAgICAgcmVzcG9uc2UgPT0gUmV2aWV3UmVzcG9uc2UuRWFzeVxuICAgICAgICAgICAgICAgID8gZWFzZSArIDIwXG4gICAgICAgICAgICAgICAgOiBNYXRoLm1heCgxMzAsIGVhc2UgLSAyMCk7XG4gICAgfVxuXG4gICAgaWYgKHJlc3BvbnNlID09IFJldmlld1Jlc3BvbnNlLkhhcmQpXG4gICAgICAgIGludGVydmFsID0gTWF0aC5tYXgoMSwgaW50ZXJ2YWwgKiBsYXBzZXNJbnRlcnZhbENoYW5nZSk7XG4gICAgZWxzZSBpbnRlcnZhbCA9IChpbnRlcnZhbCAqIGVhc2UpIC8gMTAwO1xuXG4gICAgaWYgKHJlc3BvbnNlID09IFJldmlld1Jlc3BvbnNlLkVhc3kpIGludGVydmFsICo9IGVhc3lCb251cztcblxuICAgIGlmIChmdXp6KSB7XG4gICAgICAgIC8vIGZ1enpcbiAgICAgICAgaWYgKGludGVydmFsID49IDgpIHtcbiAgICAgICAgICAgIGxldCBmdXp6ID0gWy0wLjA1ICogaW50ZXJ2YWwsIDAsIDAuMDUgKiBpbnRlcnZhbF07XG4gICAgICAgICAgICBpbnRlcnZhbCArPSBmdXp6W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGZ1enoubGVuZ3RoKV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbnRlcnZhbCA9IE1hdGgubWluKGludGVydmFsLCBtYXhpbXVtSW50ZXJ2YWwpO1xuXG4gICAgcmV0dXJuIHsgaW50ZXJ2YWw6IE1hdGgucm91bmQoaW50ZXJ2YWwgKiAxMCkgLyAxMCwgZWFzZSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGV4dEludGVydmFsKGludGVydmFsOiBudW1iZXIsIGlzTW9iaWxlOiBib29sZWFuKTogc3RyaW5nIHtcbiAgICBsZXQgbSA9IE1hdGgucm91bmQoaW50ZXJ2YWwgLyAzKSAvIDEwO1xuICAgIGxldCB5ID0gTWF0aC5yb3VuZChpbnRlcnZhbCAvIDM2LjUpIC8gMTA7XG5cbiAgICBpZiAoaXNNb2JpbGUpIHtcbiAgICAgICAgaWYgKGludGVydmFsIDwgMzApIHJldHVybiBgJHtpbnRlcnZhbH1kYDtcbiAgICAgICAgZWxzZSBpZiAoaW50ZXJ2YWwgPCAzNjUpIHJldHVybiBgJHttfW1gO1xuICAgICAgICBlbHNlIHJldHVybiBgJHt5fXlgO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpbnRlcnZhbCA8IDMwKVxuICAgICAgICAgICAgcmV0dXJuIGludGVydmFsID09IDEuMCA/IFwiMS4wIGRheVwiIDogYCR7aW50ZXJ2YWx9IGRheXNgO1xuICAgICAgICBlbHNlIGlmIChpbnRlcnZhbCA8IDM2NSkgcmV0dXJuIG0gPT0gMS4wID8gXCIxLjAgbW9udGhcIiA6IGAke219IG1vbnRoc2A7XG4gICAgICAgIGVsc2UgcmV0dXJuIHkgPT0gMS4wID8gXCIxLjAgeWVhclwiIDogYCR7eX0geWVhcnNgO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjb25zdCBTQ0hFRFVMSU5HX0lORk9fUkVHRVg6IFJlZ0V4cCA9XG4gICAgL14tLS1cXG4oKD86LipcXG4pKilzci1kdWU6ICguKylcXG5zci1pbnRlcnZhbDogKFxcZCspXFxuc3ItZWFzZTogKFxcZCspXFxuKCg/Oi4qXFxuKSopLS0tLztcbmV4cG9ydCBjb25zdCBZQU1MX0ZST05UX01BVFRFUl9SRUdFWDogUmVnRXhwID0gL14tLS1cXG4oKD86LipcXG4pKj8pLS0tLztcblxuZXhwb3J0IGNvbnN0IENMT1pFX0NBUkRfREVURUNUT1I6IFJlZ0V4cCA9XG4gICAgLyg/Oi4rXFxuKSpeLio/PT0uKj89PS4qXFxuKD86LitcXG4/KSovZ207IC8vIGNhcmQgbXVzdCBoYXZlIGF0IGxlYXN0IG9uZSBjbG96ZVxuZXhwb3J0IGNvbnN0IENMT1pFX0RFTEVUSU9OU19FWFRSQUNUT1I6IFJlZ0V4cCA9IC89PSguKj8pPT0vZ207XG5leHBvcnQgY29uc3QgQ0xPWkVfU0NIRURVTElOR19FWFRSQUNUT1I6IFJlZ0V4cCA9IC8hKFtcXGQtXSspLChcXGQrKSwoXFxkKykvZ207XG5cbmV4cG9ydCBjb25zdCBXSUtJTElOS19NRURJQV9SRUdFWDogUmVnRXhwID1cbiAgICAvIVxcW1xcWyguKj8uKD86cG5nfGpwZT9nfGdpZnxibXB8c3ZnKSkuKj9cXF1cXF0vZ207IC8vICFbWy4uLl1dIGZvcm1hdFxuZXhwb3J0IGNvbnN0IE1BUktET1dOX0xJTktfTUVESUFfUkVHRVg6IFJlZ0V4cCA9XG4gICAgLyFcXFsuKlxcXVxcKCguKi4oPzpwbmd8anBlP2d8Z2lmfGJtcHxzdmcpKVxcKS9nbTsgLy8gIVsuLi5dKC4uLikgZm9ybWF0XG5cbmV4cG9ydCBjb25zdCBDT0RFQkxPQ0tfUkVHRVg6IFJlZ0V4cCA9IC9gYGAoPzouKlxcbikqP2BgYC9nbTtcbmV4cG9ydCBjb25zdCBJTkxJTkVfQ09ERV9SRUdFWDogUmVnRXhwID0gL2AoPyFgKS4rYC9nbTtcblxuZXhwb3J0IGNvbnN0IENST1NTX0hBSVJTX0lDT046IHN0cmluZyA9IGA8cGF0aCBzdHlsZT1cIiBzdHJva2U6bm9uZTtmaWxsLXJ1bGU6bm9uemVybztmaWxsOmN1cnJlbnRDb2xvcjtmaWxsLW9wYWNpdHk6MTtcIiBkPVwiTSA5OS45MjE4NzUgNDcuOTQxNDA2IEwgOTMuMDc0MjE5IDQ3Ljk0MTQwNiBDIDkyLjg0Mzc1IDQyLjAzMTI1IDkxLjM5MDYyNSAzNi4yMzgyODEgODguODAwNzgxIDMwLjkyMTg3NSBMIDg1LjM2NzE4OCAzMi41ODIwMzEgQyA4Ny42Njc5NjkgMzcuMzU1NDY5IDg4Ljk2NDg0NCA0Mi41NTA3ODEgODkuMTgzNTk0IDQ3Ljg0Mzc1IEwgODIuMjM4MjgxIDQ3Ljg0Mzc1IEMgODIuMDk3NjU2IDQ0LjYxNzE4OCA4MS41ODk4NDQgNDEuNDE3OTY5IDgwLjczNDM3NSAzOC4zMDQ2ODggTCA3Ny4wNTA3ODEgMzkuMzM1OTM4IEMgNzcuODA4NTk0IDQyLjA4OTg0NCA3OC4yNjE3MTkgNDQuOTE3OTY5IDc4LjQwNjI1IDQ3Ljc2OTUzMSBMIDY1Ljg3MTA5NCA0Ny43Njk1MzEgQyA2NC45MTQwNjIgNDAuNTA3ODEyIDU5LjE0NDUzMSAzNC44MzIwMzEgNTEuODcxMDk0IDMzLjk5NjA5NCBMIDUxLjg3MTA5NCAyMS4zODY3MTkgQyA1NC44MTY0MDYgMjEuNTA3ODEyIDU3Ljc0MjE4OCAyMS45NjA5MzggNjAuNTg1OTM4IDIyLjczODI4MSBMIDYxLjYxNzE4OCAxOS4wNTg1OTQgQyA1OC40Mzc1IDE4LjE5MTQwNiA1NS4xNjQwNjIgMTcuNjkxNDA2IDUxLjg3MTA5NCAxNy41NzAzMTIgTCA1MS44NzEwOTQgMTAuNTUwNzgxIEMgNTcuMTY0MDYyIDEwLjc2OTUzMSA2Mi4zNTU0NjkgMTIuMDY2NDA2IDY3LjEzMjgxMiAxNC4zNjMyODEgTCA2OC43ODkwNjIgMTAuOTI5Njg4IEMgNjMuNSA4LjM4MjgxMiA1Ny43MzgyODEgNi45NTMxMjUgNTEuODcxMDk0IDYuNzM0Mzc1IEwgNTEuODcxMDk0IDAuMDM5MDYyNSBMIDQ4LjA1NDY4OCAwLjAzOTA2MjUgTCA0OC4wNTQ2ODggNi43MzQzNzUgQyA0Mi4xNzk2ODggNi45NzY1NjIgMzYuNDE3OTY5IDguNDMzNTk0IDMxLjEzMjgxMiAxMS4wMDc4MTIgTCAzMi43OTI5NjkgMTQuNDQxNDA2IEMgMzcuNTY2NDA2IDEyLjE0MDYyNSA0Mi43NjE3MTkgMTAuODQzNzUgNDguMDU0Njg4IDEwLjYyNSBMIDQ4LjA1NDY4OCAxNy41NzAzMTIgQyA0NC44MjgxMjUgMTcuNzE0ODQ0IDQxLjYyODkwNiAxOC4yMTg3NSAzOC41MTU2MjUgMTkuMDc4MTI1IEwgMzkuNTQ2ODc1IDIyLjc1NzgxMiBDIDQyLjMyNDIxOSAyMS45ODgyODEgNDUuMTc1NzgxIDIxLjUzMTI1IDQ4LjA1NDY4OCAyMS4zODY3MTkgTCA0OC4wNTQ2ODggMzQuMDMxMjUgQyA0MC43OTY4NzUgMzQuOTQ5MjE5IDM1LjA4OTg0NCA0MC42Nzk2ODggMzQuMjAzMTI1IDQ3Ljk0MTQwNiBMIDIxLjUgNDcuOTQxNDA2IEMgMjEuNjMyODEyIDQ1LjA0Mjk2OSAyMi4wODk4NDQgNDIuMTcxODc1IDIyLjg1NTQ2OSAzOS4zNzUgTCAxOS4xNzE4NzUgMzguMzQzNzUgQyAxOC4zMTI1IDQxLjQ1NzAzMSAxNy44MDg1OTQgNDQuNjU2MjUgMTcuNjY0MDYyIDQ3Ljg4MjgxMiBMIDEwLjY2NDA2MiA0Ny44ODI4MTIgQyAxMC44ODI4MTIgNDIuNTg5ODQ0IDEyLjE3OTY4OCAzNy4zOTQ1MzEgMTQuNDgwNDY5IDMyLjYyMTA5NCBMIDExLjEyMTA5NCAzMC45MjE4NzUgQyA4LjUzNTE1NiAzNi4yMzgyODEgNy4wNzgxMjUgNDIuMDMxMjUgNi44NDc2NTYgNDcuOTQxNDA2IEwgMCA0Ny45NDE0MDYgTCAwIDUxLjc1MzkwNiBMIDYuODQ3NjU2IDUxLjc1MzkwNiBDIDcuMDg5ODQ0IDU3LjYzNjcxOSA4LjU0Mjk2OSA2My40MDIzNDQgMTEuMTIxMDk0IDY4LjY5NTMxMiBMIDE0LjU1NDY4OCA2Ny4wMzUxNTYgQyAxMi4yNTc4MTIgNjIuMjYxNzE5IDEwLjk1NzAzMSA1Ny4wNjY0MDYgMTAuNzM4MjgxIDUxLjc3MzQzOCBMIDE3Ljc0MjE4OCA1MS43NzM0MzggQyAxNy44NTU0NjkgNTUuMDQyOTY5IDE4LjM0Mzc1IDU4LjI4OTA2MiAxOS4xOTE0MDYgNjEuNDQ1MzEyIEwgMjIuODcxMDk0IDYwLjQxNDA2MiBDIDIyLjA4OTg0NCA1Ny41NjI1IDIxLjYyODkwNiA1NC42MzI4MTIgMjEuNSA1MS42Nzk2ODggTCAzNC4yMDMxMjUgNTEuNjc5Njg4IEMgMzUuMDU4NTk0IDU4Ljk2ODc1IDQwLjc3MzQzOCA2NC43MzgyODEgNDguMDU0Njg4IDY1LjY2MDE1NiBMIDQ4LjA1NDY4OCA3OC4zMDg1OTQgQyA0NS4xMDU0NjkgNzguMTg3NSA0Mi4xODM1OTQgNzcuNzMwNDY5IDM5LjMzNTkzOCA3Ni45NTcwMzEgTCAzOC4zMDQ2ODggODAuNjM2NzE5IEMgNDEuNDg4MjgxIDgxLjUxMTcxOSA0NC43NTc4MTIgODIuMDE1NjI1IDQ4LjA1NDY4OCA4Mi4xNDQ1MzEgTCA0OC4wNTQ2ODggODkuMTQ0NTMxIEMgNDIuNzYxNzE5IDg4LjkyNTc4MSAzNy41NjY0MDYgODcuNjI4OTA2IDMyLjc5Mjk2OSA4NS4zMjgxMjUgTCAzMS4xMzI4MTIgODguNzY1NjI1IEMgMzYuNDI1NzgxIDkxLjMxMjUgNDIuMTgzNTk0IDkyLjc0MjE4OCA0OC4wNTQ2ODggOTIuOTYwOTM4IEwgNDguMDU0Njg4IDk5Ljk2MDkzOCBMIDUxLjg3MTA5NCA5OS45NjA5MzggTCA1MS44NzEwOTQgOTIuOTYwOTM4IEMgNTcuNzUgOTIuNzE4NzUgNjMuNTE5NTMxIDkxLjI2NTYyNSA2OC44MDg1OTQgODguNjg3NSBMIDY3LjEzMjgxMiA4NS4yNTM5MDYgQyA2Mi4zNTU0NjkgODcuNTUwNzgxIDU3LjE2NDA2MiA4OC44NTE1NjIgNTEuODcxMDk0IDg5LjA3MDMxMiBMIDUxLjg3MTA5NCA4Mi4xMjUgQyA1NS4wOTM3NSA4MS45ODA0NjkgNTguMjkyOTY5IDgxLjQ3NjU2MiA2MS40MDYyNSA4MC42MTcxODggTCA2MC4zNzg5MDYgNzYuOTM3NSBDIDU3LjU3NDIxOSA3Ny43MDMxMjUgNTQuNjk1MzEyIDc4LjE1NjI1IDUxLjc5Mjk2OSA3OC4yODkwNjIgTCA1MS43OTI5NjkgNjUuNjc5Njg4IEMgNTkuMTIxMDk0IDY0LjgyODEyNSA2NC45MTAxNTYgNTkuMDYyNSA2NS43OTY4NzUgNTEuNzM0Mzc1IEwgNzguMzY3MTg4IDUxLjczNDM3NSBDIDc4LjI1IDU0LjczNDM3NSA3Ny43ODkwNjIgNTcuNzEwOTM4IDc2Ljk5MjE4OCA2MC42MDU0NjkgTCA4MC42NzU3ODEgNjEuNjM2NzE5IEMgODEuNTU4NTk0IDU4LjQwNjI1IDgyLjA2NjQwNiA1NS4wODIwMzEgODIuMTgzNTk0IDUxLjczNDM3NSBMIDg5LjI2MTcxOSA1MS43MzQzNzUgQyA4OS4wNDI5NjkgNTcuMDMxMjUgODcuNzQyMTg4IDYyLjIyMjY1NiA4NS40NDUzMTIgNjYuOTk2MDk0IEwgODguODc4OTA2IDY4LjY1NjI1IEMgOTEuNDU3MDMxIDYzLjM2NzE4OCA5Mi45MTAxNTYgNTcuNTk3NjU2IDkzLjE1MjM0NCA1MS43MTg3NSBMIDEwMCA1MS43MTg3NSBaIE0gNjIuMDE5NTMxIDUxLjczNDM3NSBDIDYxLjE4MzU5NCA1Ni45NDUzMTIgNTcuMDg1OTM4IDYxLjAyMzQzOCA1MS44NzEwOTQgNjEuODI4MTI1IEwgNTEuODcxMDk0IDU3LjUxNTYyNSBMIDQ4LjA1NDY4OCA1Ny41MTU2MjUgTCA0OC4wNTQ2ODggNjEuODA4NTk0IEMgNDIuOTEwMTU2IDYwLjk0OTIxOSAzOC44ODY3MTkgNTYuOTAyMzQ0IDM4LjA1ODU5NCA1MS43NTM5MDYgTCA0Mi4zMzIwMzEgNTEuNzUzOTA2IEwgNDIuMzMyMDMxIDQ3Ljk0MTQwNiBMIDM4LjA1ODU5NCA0Ny45NDE0MDYgQyAzOC44ODY3MTkgNDIuNzg5MDYyIDQyLjkxMDE1NiAzOC43NDYwOTQgNDguMDU0Njg4IDM3Ljg4NjcxOSBMIDQ4LjA1NDY4OCA0Mi4xNzk2ODggTCA1MS44NzEwOTQgNDIuMTc5Njg4IEwgNTEuODcxMDk0IDM3Ljg0NzY1NiBDIDU3LjA3ODEyNSAzOC42NDg0MzggNjEuMTc5Njg4IDQyLjcxODc1IDYyLjAxOTUzMSA0Ny45MjE4NzUgTCA1Ny43MDcwMzEgNDcuOTIxODc1IEwgNTcuNzA3MDMxIDUxLjczNDM3NSBaIE0gNjIuMDE5NTMxIDUxLjczNDM3NSBcIi8+YDtcbmV4cG9ydCBjb25zdCBDT0xMQVBTRV9JQ09OOiBzdHJpbmcgPSBgPHN2ZyB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiB3aWR0aD1cIjhcIiBoZWlnaHQ9XCI4XCIgY2xhc3M9XCJyaWdodC10cmlhbmdsZVwiPjxwYXRoIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBkPVwiTTk0LjksMjAuOGMtMS40LTIuNS00LjEtNC4xLTcuMS00LjFIMTIuMmMtMywwLTUuNywxLjYtNy4xLDQuMWMtMS4zLDIuNC0xLjIsNS4yLDAuMiw3LjZMNDMuMSw4OGMxLjUsMi4zLDQsMy43LDYuOSwzLjcgczUuNC0xLjQsNi45LTMuN2wzNy44LTU5LjZDOTYuMSwyNiw5Ni4yLDIzLjIsOTQuOSwyMC44TDk0LjksMjAuOHpcIj48L3BhdGg+PC9zdmc+YDtcbiIsImltcG9ydCB7IE1vZGFsLCBBcHAsIE1hcmtkb3duUmVuZGVyZXIsIE5vdGljZSwgUGxhdGZvcm0gfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIFNSUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IENhcmQsIENhcmRUeXBlLCBGbGFzaGNhcmRNb2RhbE1vZGUsIFJldmlld1Jlc3BvbnNlIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IHNjaGVkdWxlLCB0ZXh0SW50ZXJ2YWwgfSBmcm9tIFwiLi9zY2hlZFwiO1xuaW1wb3J0IHsgQ0xPWkVfU0NIRURVTElOR19FWFRSQUNUT1IgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IGdldFNldHRpbmcgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgZXNjYXBlUmVnZXhTdHJpbmcgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgRmxhc2hjYXJkTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gICAgcHJpdmF0ZSBwbHVnaW46IFNSUGx1Z2luO1xuICAgIHByaXZhdGUgYW5zd2VyQnRuOiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGZsYXNoY2FyZFZpZXc6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgaGFyZEJ0bjogSFRNTEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBnb29kQnRuOiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGVhc3lCdG46IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgcmVzcG9uc2VEaXY6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgZmlsZUxpbmtWaWV3OiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIHJlc2V0TGlua1ZpZXc6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgY29udGV4dFZpZXc6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgY3VycmVudENhcmQ6IENhcmQ7XG4gICAgcHJpdmF0ZSBjdXJyZW50RGVjazogc3RyaW5nO1xuICAgIHByaXZhdGUgbW9kZTogRmxhc2hjYXJkTW9kYWxNb2RlO1xuXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogU1JQbHVnaW4pIHtcbiAgICAgICAgc3VwZXIoYXBwKTtcblxuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblxuICAgICAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIkRlY2tzXCIpO1xuXG4gICAgICAgIGlmIChQbGF0Zm9ybS5pc01vYmlsZSkge1xuICAgICAgICAgICAgdGhpcy5tb2RhbEVsLnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgICAgICAgICAgdGhpcy5tb2RhbEVsLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tb2RhbEVsLnN0eWxlLmhlaWdodCA9IFwiODAlXCI7XG4gICAgICAgICAgICB0aGlzLm1vZGFsRWwuc3R5bGUud2lkdGggPSBcIjQwJVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250ZW50RWwuc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG4gICAgICAgIHRoaXMuY29udGVudEVsLnN0eWxlLmhlaWdodCA9IFwiOTIlXCI7XG4gICAgICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwic3ItbW9kYWwtY29udGVudFwiKTtcblxuICAgICAgICBkb2N1bWVudC5ib2R5Lm9ua2V5cHJlc3MgPSAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSAhPSBGbGFzaGNhcmRNb2RhbE1vZGUuRGVja3NMaXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGUgIT0gRmxhc2hjYXJkTW9kYWxNb2RlLkNsb3NlZCAmJlxuICAgICAgICAgICAgICAgICAgICBlLmNvZGUgPT0gXCJLZXlTXCJcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuaXNEdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kdWVGbGFzaGNhcmRzW3RoaXMuY3VycmVudERlY2tdLnNwbGljZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLm5ld0ZsYXNoY2FyZHNbdGhpcy5jdXJyZW50RGVja10uc3BsaWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuY2FyZFR5cGUgPT0gQ2FyZFR5cGUuQ2xvemUpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1cnlSZWxhdGVkQ2FyZHModGhpcy5jdXJyZW50Q2FyZC5yZWxhdGVkQ2FyZHMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRDYXJkKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2RlID09IEZsYXNoY2FyZE1vZGFsTW9kZS5Gcm9udCAmJlxuICAgICAgICAgICAgICAgICAgICAoZS5jb2RlID09IFwiU3BhY2VcIiB8fCBlLmNvZGUgPT0gXCJFbnRlclwiKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93QW5zd2VyKCk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5tb2RlID09IEZsYXNoY2FyZE1vZGFsTW9kZS5CYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmNvZGUgPT0gXCJOdW1wYWQxXCIgfHwgZS5jb2RlID09IFwiRGlnaXQxXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuSGFyZCk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGUuY29kZSA9PSBcIk51bXBhZDJcIiB8fCBlLmNvZGUgPT0gXCJEaWdpdDJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1JldmlldyhSZXZpZXdSZXNwb25zZS5Hb29kKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZS5jb2RlID09IFwiTnVtcGFkM1wiIHx8IGUuY29kZSA9PSBcIkRpZ2l0M1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmV2aWV3KFJldmlld1Jlc3BvbnNlLkVhc3kpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChlLmNvZGUgPT0gXCJOdW1wYWQwXCIgfHwgZS5jb2RlID09IFwiRGlnaXQwXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuUmVzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBvbk9wZW4oKSB7XG4gICAgICAgIHRoaXMuZGVja3NMaXN0KCk7XG4gICAgfVxuXG4gICAgb25DbG9zZSgpIHtcbiAgICAgICAgdGhpcy5tb2RlID0gRmxhc2hjYXJkTW9kYWxNb2RlLkNsb3NlZDtcbiAgICB9XG5cbiAgICBkZWNrc0xpc3QoKSB7XG4gICAgICAgIHRoaXMubW9kZSA9IEZsYXNoY2FyZE1vZGFsTW9kZS5EZWNrc0xpc3Q7XG4gICAgICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiRGVja3NcIik7XG4gICAgICAgIHRoaXMuY29udGVudEVsLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIGxldCBjb2xIZWFkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KFwic3ItZGVja1wiKTtcbiAgICAgICAgY29sSGVhZGluZy5pbm5lckhUTUwgPVxuICAgICAgICAgICAgXCI8aT48L2k+PHNwYW4gc3R5bGU9J3RleHQtYWxpZ246cmlnaHQ7Jz5EdWU8L3NwYW4+XCIgK1xuICAgICAgICAgICAgXCI8c3BhbiBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodDsnPk5ldzwvc3Bhbj5cIjtcbiAgICAgICAgZm9yIChsZXQgZGVja05hbWUgaW4gdGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkcykge1xuICAgICAgICAgICAgbGV0IGRlY2tWaWV3ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KFwic3ItZGVja1wiKTtcbiAgICAgICAgICAgIGRlY2tWaWV3LnNldFRleHQoZGVja05hbWUpO1xuICAgICAgICAgICAgZGVja1ZpZXcuaW5uZXJIVE1MICs9XG4gICAgICAgICAgICAgICAgYDxzcGFuIHN0eWxlPVwiY29sb3I6IzRjYWY1MDt0ZXh0LWFsaWduOnJpZ2h0O1wiPiR7dGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1tkZWNrTmFtZV0ubGVuZ3RofTwvc3Bhbj5gICtcbiAgICAgICAgICAgICAgICBgPHNwYW4gc3R5bGU9XCJjb2xvcjojMjE5NmYzO3RleHQtYWxpZ246cmlnaHQ7XCI+JHt0aGlzLnBsdWdpbi5uZXdGbGFzaGNhcmRzW2RlY2tOYW1lXS5sZW5ndGh9PC9zcGFuPmA7XG4gICAgICAgICAgICBkZWNrVmlldy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnREZWNrID0gZGVja05hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR1cENhcmRzVmlldygpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dENhcmQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0dXBDYXJkc1ZpZXcoKSB7XG4gICAgICAgIHRoaXMuY29udGVudEVsLmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICAgICAgdGhpcy5maWxlTGlua1ZpZXcgPSBjcmVhdGVEaXYoXCJzci1saW5rXCIpO1xuICAgICAgICB0aGlzLmZpbGVMaW5rVmlldy5zZXRUZXh0KFwiT3BlbiBmaWxlXCIpO1xuICAgICAgICB0aGlzLmZpbGVMaW5rVmlldy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZi5vcGVuRmlsZShcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLm5vdGVcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbnRlbnRFbC5hcHBlbmRDaGlsZCh0aGlzLmZpbGVMaW5rVmlldyk7XG5cbiAgICAgICAgdGhpcy5yZXNldExpbmtWaWV3ID0gY3JlYXRlRGl2KFwic3ItbGlua1wiKTtcbiAgICAgICAgdGhpcy5yZXNldExpbmtWaWV3LnNldFRleHQoXCJSZXNldCBjYXJkJ3MgcHJvZ3Jlc3NcIik7XG4gICAgICAgIHRoaXMucmVzZXRMaW5rVmlldy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1JldmlldyhSZXZpZXdSZXNwb25zZS5SZXNldCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlc2V0TGlua1ZpZXcuc3R5bGUuZmxvYXQgPSBcInJpZ2h0XCI7XG4gICAgICAgIHRoaXMuY29udGVudEVsLmFwcGVuZENoaWxkKHRoaXMucmVzZXRMaW5rVmlldyk7XG5cbiAgICAgICAgaWYgKGdldFNldHRpbmcoXCJzaG93Q29udGV4dEluQ2FyZHNcIiwgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncykpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dFZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0Vmlldy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLWNvbnRleHRcIik7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRFbC5hcHBlbmRDaGlsZCh0aGlzLmNvbnRleHRWaWV3KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZmxhc2hjYXJkVmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuZmxhc2hjYXJkVmlldy5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLWZsYXNoY2FyZC12aWV3XCIpO1xuICAgICAgICB0aGlzLmNvbnRlbnRFbC5hcHBlbmRDaGlsZCh0aGlzLmZsYXNoY2FyZFZpZXcpO1xuXG4gICAgICAgIHRoaXMucmVzcG9uc2VEaXYgPSBjcmVhdGVEaXYoXCJzci1yZXNwb25zZVwiKTtcblxuICAgICAgICB0aGlzLmhhcmRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLmhhcmRCdG4uc2V0QXR0cmlidXRlKFwiaWRcIiwgXCJzci1oYXJkLWJ0blwiKTtcbiAgICAgICAgdGhpcy5oYXJkQnRuLnNldFRleHQoXCJIYXJkXCIpO1xuICAgICAgICB0aGlzLmhhcmRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChfKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXZpZXcoUmV2aWV3UmVzcG9uc2UuSGFyZCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlc3BvbnNlRGl2LmFwcGVuZENoaWxkKHRoaXMuaGFyZEJ0bik7XG5cbiAgICAgICAgdGhpcy5nb29kQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5nb29kQnRuLnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3ItZ29vZC1idG5cIik7XG4gICAgICAgIHRoaXMuZ29vZEJ0bi5zZXRUZXh0KFwiR29vZFwiKTtcbiAgICAgICAgdGhpcy5nb29kQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoXykgPT4ge1xuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmV2aWV3KFJldmlld1Jlc3BvbnNlLkdvb2QpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yZXNwb25zZURpdi5hcHBlbmRDaGlsZCh0aGlzLmdvb2RCdG4pO1xuXG4gICAgICAgIHRoaXMuZWFzeUJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuZWFzeUJ0bi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLWVhc3ktYnRuXCIpO1xuICAgICAgICB0aGlzLmVhc3lCdG4uc2V0VGV4dChcIkVhc3lcIik7XG4gICAgICAgIHRoaXMuZWFzeUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF8pID0+IHtcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1JldmlldyhSZXZpZXdSZXNwb25zZS5FYXN5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVzcG9uc2VEaXYuYXBwZW5kQ2hpbGQodGhpcy5lYXN5QnRuKTtcbiAgICAgICAgdGhpcy5yZXNwb25zZURpdi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgICAgICAgdGhpcy5jb250ZW50RWwuYXBwZW5kQ2hpbGQodGhpcy5yZXNwb25zZURpdik7XG5cbiAgICAgICAgdGhpcy5hbnN3ZXJCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLmFuc3dlckJ0bi5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcInNyLXNob3ctYW5zd2VyXCIpO1xuICAgICAgICB0aGlzLmFuc3dlckJ0bi5zZXRUZXh0KFwiU2hvdyBBbnN3ZXJcIik7XG4gICAgICAgIHRoaXMuYW5zd2VyQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoXykgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93QW5zd2VyKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbnRlbnRFbC5hcHBlbmRDaGlsZCh0aGlzLmFuc3dlckJ0bik7XG4gICAgfVxuXG4gICAgbmV4dENhcmQoKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VEaXYuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB0aGlzLnJlc2V0TGlua1ZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsZXQgY291bnQgPVxuICAgICAgICAgICAgdGhpcy5wbHVnaW4ubmV3Rmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5sZW5ndGggK1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5sZW5ndGg7XG4gICAgICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KGAke3RoaXMuY3VycmVudERlY2t9IC0gJHtjb3VudH1gKTtcblxuICAgICAgICBpZiAoY291bnQgPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5kZWNrc0xpc3QoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYW5zd2VyQnRuLnN0eWxlLmRpc3BsYXkgPSBcImluaXRpYWxcIjtcbiAgICAgICAgdGhpcy5mbGFzaGNhcmRWaWV3LmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHRoaXMubW9kZSA9IEZsYXNoY2FyZE1vZGFsTW9kZS5Gcm9udDtcblxuICAgICAgICBpZiAodGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkID0gdGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXVswXTtcbiAgICAgICAgICAgIE1hcmtkb3duUmVuZGVyZXIucmVuZGVyTWFya2Rvd24oXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5mcm9udCxcbiAgICAgICAgICAgICAgICB0aGlzLmZsYXNoY2FyZFZpZXcsXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5ub3RlLnBhdGgsXG4gICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgbGV0IGhhcmRJbnRlcnZhbCA9IHNjaGVkdWxlKFxuICAgICAgICAgICAgICAgIFJldmlld1Jlc3BvbnNlLkhhcmQsXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5pbnRlcnZhbCxcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmVhc2UsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgKS5pbnRlcnZhbDtcbiAgICAgICAgICAgIGxldCBnb29kSW50ZXJ2YWwgPSBzY2hlZHVsZShcbiAgICAgICAgICAgICAgICBSZXZpZXdSZXNwb25zZS5Hb29kLFxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuaW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5lYXNlLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICkuaW50ZXJ2YWw7XG4gICAgICAgICAgICBsZXQgZWFzeUludGVydmFsID0gc2NoZWR1bGUoXG4gICAgICAgICAgICAgICAgUmV2aWV3UmVzcG9uc2UuRWFzeSxcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmludGVydmFsLFxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuZWFzZSxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzXG4gICAgICAgICAgICApLmludGVydmFsO1xuXG4gICAgICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhcmRCdG4uc2V0VGV4dCh0ZXh0SW50ZXJ2YWwoaGFyZEludGVydmFsLCB0cnVlKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5nb29kQnRuLnNldFRleHQodGV4dEludGVydmFsKGdvb2RJbnRlcnZhbCwgdHJ1ZSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZWFzeUJ0bi5zZXRUZXh0KHRleHRJbnRlcnZhbChlYXN5SW50ZXJ2YWwsIHRydWUpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXJkQnRuLnNldFRleHQoXG4gICAgICAgICAgICAgICAgICAgIGBIYXJkIC0gJHt0ZXh0SW50ZXJ2YWwoaGFyZEludGVydmFsLCBmYWxzZSl9YFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5nb29kQnRuLnNldFRleHQoXG4gICAgICAgICAgICAgICAgICAgIGBHb29kIC0gJHt0ZXh0SW50ZXJ2YWwoZ29vZEludGVydmFsLCBmYWxzZSl9YFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5lYXN5QnRuLnNldFRleHQoXG4gICAgICAgICAgICAgICAgICAgIGBFYXN5IC0gJHt0ZXh0SW50ZXJ2YWwoZWFzeUludGVydmFsLCBmYWxzZSl9YFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5wbHVnaW4ubmV3Rmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkID0gdGhpcy5wbHVnaW4ubmV3Rmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXVswXTtcbiAgICAgICAgICAgIE1hcmtkb3duUmVuZGVyZXIucmVuZGVyTWFya2Rvd24oXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5mcm9udCxcbiAgICAgICAgICAgICAgICB0aGlzLmZsYXNoY2FyZFZpZXcsXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5ub3RlLnBhdGgsXG4gICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKFBsYXRmb3JtLmlzTW9iaWxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYXJkQnRuLnNldFRleHQoXCIxLjBkXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ29vZEJ0bi5zZXRUZXh0KFwiMi41ZFwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVhc3lCdG4uc2V0VGV4dChcIjMuNWRcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaGFyZEJ0bi5zZXRUZXh0KFwiSGFyZCAtIDEuMCBkYXlcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5nb29kQnRuLnNldFRleHQoXCJHb29kIC0gMi41IGRheXNcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5lYXN5QnRuLnNldFRleHQoXCJFYXN5IC0gMy41IGRheXNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2V0U2V0dGluZyhcInNob3dDb250ZXh0SW5DYXJkc1wiLCB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzKSlcbiAgICAgICAgICAgIHRoaXMuY29udGV4dFZpZXcuc2V0VGV4dCh0aGlzLmN1cnJlbnRDYXJkLmNvbnRleHQpO1xuICAgIH1cblxuICAgIHNob3dBbnN3ZXIoKSB7XG4gICAgICAgIHRoaXMubW9kZSA9IEZsYXNoY2FyZE1vZGFsTW9kZS5CYWNrO1xuXG4gICAgICAgIHRoaXMuYW5zd2VyQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgdGhpcy5yZXNwb25zZURpdi5zdHlsZS5kaXNwbGF5ID0gXCJncmlkXCI7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuaXNEdWUpXG4gICAgICAgICAgICB0aGlzLnJlc2V0TGlua1ZpZXcuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuY2FyZFR5cGUgIT0gQ2FyZFR5cGUuQ2xvemUpIHtcbiAgICAgICAgICAgIGxldCBociA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoclwiKTtcbiAgICAgICAgICAgIGhyLnNldEF0dHJpYnV0ZShcImlkXCIsIFwic3ItaHItY2FyZC1kaXZpZGVcIik7XG4gICAgICAgICAgICB0aGlzLmZsYXNoY2FyZFZpZXcuYXBwZW5kQ2hpbGQoaHIpO1xuICAgICAgICB9IGVsc2UgdGhpcy5mbGFzaGNhcmRWaWV3LmlubmVySFRNTCA9IFwiXCI7XG5cbiAgICAgICAgTWFya2Rvd25SZW5kZXJlci5yZW5kZXJNYXJrZG93bihcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuYmFjayxcbiAgICAgICAgICAgIHRoaXMuZmxhc2hjYXJkVmlldyxcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQubm90ZS5wYXRoLFxuICAgICAgICAgICAgbnVsbFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGFzeW5jIHByb2Nlc3NSZXZpZXcocmVzcG9uc2U6IFJldmlld1Jlc3BvbnNlKSB7XG4gICAgICAgIGxldCBpbnRlcnZhbCwgZWFzZSwgZHVlO1xuXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBSZXZpZXdSZXNwb25zZS5SZXNldCkge1xuICAgICAgICAgICAgLy8gc2NoZWR1bGVkIGNhcmRcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDYXJkLmlzRHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5zcGxpY2UoMCwgMSk7XG4gICAgICAgICAgICAgICAgbGV0IHNjaGVkT2JqID0gc2NoZWR1bGUoXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmVhc2UsXG4gICAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGludGVydmFsID0gTWF0aC5yb3VuZChzY2hlZE9iai5pbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgZWFzZSA9IHNjaGVkT2JqLmVhc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCBzY2hlZE9iaiA9IHNjaGVkdWxlKFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAgICAgZ2V0U2V0dGluZyhcImJhc2VFYXNlXCIsIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MpLFxuICAgICAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5kYXRhLnNldHRpbmdzXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5uZXdGbGFzaGNhcmRzW3RoaXMuY3VycmVudERlY2tdLnNwbGljZSgwLCAxKTtcbiAgICAgICAgICAgICAgICBpbnRlcnZhbCA9IE1hdGgucm91bmQoc2NoZWRPYmouaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIGVhc2UgPSBzY2hlZE9iai5lYXNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkdWUgPSB3aW5kb3cubW9tZW50KERhdGUubm93KCkgKyBpbnRlcnZhbCAqIDI0ICogMzYwMCAqIDEwMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW50ZXJ2YWwgPSAxLjA7XG4gICAgICAgICAgICBlYXNlID0gdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5ncy5iYXNlRWFzZTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmR1ZUZsYXNoY2FyZHNbdGhpcy5jdXJyZW50RGVja10uc3BsaWNlKDAsIDEpO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5wdXNoKHRoaXMuY3VycmVudENhcmQpO1xuICAgICAgICAgICAgZHVlID0gd2luZG93Lm1vbWVudChEYXRlLm5vdygpKTtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJDYXJkJ3MgcHJvZ3Jlc3MgaGFzIGJlZW4gcmVzZXRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZHVlU3RyaW5nID0gZHVlLmZvcm1hdChcIllZWVktTU0tRERcIik7XG5cbiAgICAgICAgbGV0IGZpbGVUZXh0ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZCh0aGlzLmN1cnJlbnRDYXJkLm5vdGUpO1xuICAgICAgICBsZXQgcmVwbGFjZW1lbnRSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgICBlc2NhcGVSZWdleFN0cmluZyh0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0KSxcbiAgICAgICAgICAgIFwiZ21cIlxuICAgICAgICApO1xuXG4gICAgICAgIGxldCBzZXAgPSBnZXRTZXR0aW5nKFwiY2FyZENvbW1lbnRPblNhbWVMaW5lXCIsIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MpXG4gICAgICAgICAgICA/IFwiIFwiXG4gICAgICAgICAgICA6IFwiXFxuXCI7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuY2FyZFR5cGUgPT0gQ2FyZFR5cGUuQ2xvemUpIHtcbiAgICAgICAgICAgIGxldCBzY2hlZElkeCA9IHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQubGFzdEluZGV4T2YoXCI8IS0tU1I6XCIpO1xuICAgICAgICAgICAgaWYgKHNjaGVkSWR4ID09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgdGltZSBhZGRpbmcgc2NoZWR1bGluZyBpbmZvcm1hdGlvbiB0byBmbGFzaGNhcmRcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0ID0gYCR7dGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dH0ke3NlcH08IS0tU1I6ISR7ZHVlU3RyaW5nfSwke2ludGVydmFsfSwke2Vhc2V9LS0+YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjaGVkdWxpbmcgPSBbXG4gICAgICAgICAgICAgICAgICAgIC4uLnRoaXMuY3VycmVudENhcmQuY2FyZFRleHQubWF0Y2hBbGwoXG4gICAgICAgICAgICAgICAgICAgICAgICBDTE9aRV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUlxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBsZXQgZGVsZXRpb25TY2hlZCA9IFtcIjBcIiwgZHVlU3RyaW5nLCBgJHtpbnRlcnZhbH1gLCBgJHtlYXNlfWBdO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDYXJkLmlzRHVlKVxuICAgICAgICAgICAgICAgICAgICBzY2hlZHVsaW5nW3RoaXMuY3VycmVudENhcmQuc3ViQ2FyZElkeF0gPSBkZWxldGlvblNjaGVkO1xuICAgICAgICAgICAgICAgIGVsc2Ugc2NoZWR1bGluZy5wdXNoKGRlbGV0aW9uU2NoZWQpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dCA9IHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgLzwhLS1TUjouKy0tPi9nbSxcbiAgICAgICAgICAgICAgICAgICAgXCJcIlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dCArPSBcIjwhLS1TUjpcIjtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVkdWxpbmcubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmQuY2FyZFRleHQgKz0gYCEke3NjaGVkdWxpbmdbaV1bMV19LCR7c2NoZWR1bGluZ1tpXVsyXX0sJHtzY2hlZHVsaW5nW2ldWzNdfWA7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5jYXJkVGV4dCArPSBcIi0tPlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlVGV4dCA9IGZpbGVUZXh0LnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgcmVwbGFjZW1lbnRSZWdleCxcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgZm9yIChsZXQgcmVsYXRlZENhcmQgb2YgdGhpcy5jdXJyZW50Q2FyZC5yZWxhdGVkQ2FyZHMpXG4gICAgICAgICAgICAgICAgcmVsYXRlZENhcmQuY2FyZFRleHQgPSB0aGlzLmN1cnJlbnRDYXJkLmNhcmRUZXh0O1xuICAgICAgICAgICAgaWYgKHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3MuYnVyeVJlbGF0ZWRDYXJkcylcbiAgICAgICAgICAgICAgICB0aGlzLmJ1cnlSZWxhdGVkQ2FyZHModGhpcy5jdXJyZW50Q2FyZC5yZWxhdGVkQ2FyZHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENhcmQuY2FyZFR5cGUgPT0gQ2FyZFR5cGUuU2luZ2xlTGluZUJhc2ljKSB7XG4gICAgICAgICAgICAgICAgZmlsZVRleHQgPSBmaWxlVGV4dC5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICByZXBsYWNlbWVudFJlZ2V4LFxuICAgICAgICAgICAgICAgICAgICBgJHt0aGlzLmN1cnJlbnRDYXJkLm9yaWdpbmFsRnJvbnRUZXh0fSR7Z2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2luZ2xlbGluZUNhcmRTZXBhcmF0b3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgKX0ke1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZC5vcmlnaW5hbEJhY2tUZXh0XG4gICAgICAgICAgICAgICAgICAgIH0ke3NlcH08IS0tU1I6JHtkdWVTdHJpbmd9LCR7aW50ZXJ2YWx9LCR7ZWFzZX0tLT5gXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlsZVRleHQgPSBmaWxlVGV4dC5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICByZXBsYWNlbWVudFJlZ2V4LFxuICAgICAgICAgICAgICAgICAgICBgJHt0aGlzLmN1cnJlbnRDYXJkLm9yaWdpbmFsRnJvbnRUZXh0fVxcbiR7Z2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibXVsdGlsaW5lQ2FyZFNlcGFyYXRvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZGF0YS5zZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICApfVxcbiR7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkLm9yaWdpbmFsQmFja1RleHRcbiAgICAgICAgICAgICAgICAgICAgfSR7c2VwfTwhLS1TUjoke2R1ZVN0cmluZ30sJHtpbnRlcnZhbH0sJHtlYXNlfS0tPmBcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHRoaXMuY3VycmVudENhcmQubm90ZSwgZmlsZVRleHQpO1xuICAgICAgICB0aGlzLm5leHRDYXJkKCk7XG4gICAgfVxuXG4gICAgYnVyeVJlbGF0ZWRDYXJkcyhhcnI6IENhcmRbXSkge1xuICAgICAgICBmb3IgKGxldCByZWxhdGVkQ2FyZCBvZiBhcnIpIHtcbiAgICAgICAgICAgIGxldCBkdWVJZHggPVxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmR1ZUZsYXNoY2FyZHNbdGhpcy5jdXJyZW50RGVja10uaW5kZXhPZihcbiAgICAgICAgICAgICAgICAgICAgcmVsYXRlZENhcmRcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IG5ld0lkeCA9XG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4ubmV3Rmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5pbmRleE9mKFxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkQ2FyZFxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChkdWVJZHggIT0gLTEpXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZHVlRmxhc2hjYXJkc1t0aGlzLmN1cnJlbnREZWNrXS5zcGxpY2UoZHVlSWR4LCAxKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld0lkeCAhPSAtMSlcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5uZXdGbGFzaGNhcmRzW3RoaXMuY3VycmVudERlY2tdLnNwbGljZShuZXdJZHgsIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYsIE1lbnUsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBTUlBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBDT0xMQVBTRV9JQ09OIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBnZXRTZXR0aW5nIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxuZXhwb3J0IGNvbnN0IFJFVklFV19RVUVVRV9WSUVXX1RZUEUgPSBcInJldmlldy1xdWV1ZS1saXN0LXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIFJldmlld1F1ZXVlTGlzdFZpZXcgZXh0ZW5kcyBJdGVtVmlldyB7XG4gICAgcHJpdmF0ZSBwbHVnaW46IFNSUGx1Z2luO1xuICAgIHByaXZhdGUgYWN0aXZlRm9sZGVyczogU2V0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IFNSUGx1Z2luKSB7XG4gICAgICAgIHN1cGVyKGxlYWYpO1xuXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLmFjdGl2ZUZvbGRlcnMgPSBuZXcgU2V0KFtcIlRvZGF5XCJdKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsIChfOiBhbnkpID0+IHRoaXMucmVkcmF3KCkpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgICAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwicmVuYW1lXCIsIChfOiBhbnkpID0+IHRoaXMucmVkcmF3KCkpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFZpZXdUeXBlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBSRVZJRVdfUVVFVUVfVklFV19UWVBFO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gXCJOb3RlcyBSZXZpZXcgUXVldWVcIjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gXCJjcm9zc2hhaXJzXCI7XG4gICAgfVxuXG4gICAgcHVibGljIG9uSGVhZGVyTWVudShtZW51OiBNZW51KSB7XG4gICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgaXRlbS5zZXRUaXRsZShcIkNsb3NlXCIpXG4gICAgICAgICAgICAgICAgLnNldEljb24oXCJjcm9zc1wiKVxuICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShcbiAgICAgICAgICAgICAgICAgICAgICAgIFJFVklFV19RVUVVRV9WSUVXX1RZUEVcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlZHJhdygpIHtcbiAgICAgICAgY29uc3Qgb3BlbkZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuXG4gICAgICAgIGNvbnN0IHJvb3RFbCA9IGNyZWF0ZURpdihcIm5hdi1mb2xkZXIgbW9kLXJvb3RcIik7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuRWwgPSByb290RWwuY3JlYXRlRGl2KFwibmF2LWZvbGRlci1jaGlsZHJlblwiKTtcblxuICAgICAgICBpZiAodGhpcy5wbHVnaW4ubmV3Tm90ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IG5ld05vdGVzRm9sZGVyRWwgPSB0aGlzLmNyZWF0ZVJpZ2h0UGFuZUZvbGRlcihcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkVsLFxuICAgICAgICAgICAgICAgIFwiTmV3XCIsXG4gICAgICAgICAgICAgICAgIXRoaXMuYWN0aXZlRm9sZGVycy5oYXMoXCJOZXdcIilcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGZvciAobGV0IG5ld0ZpbGUgb2YgdGhpcy5wbHVnaW4ubmV3Tm90ZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZVJpZ2h0UGFuZUZpbGUoXG4gICAgICAgICAgICAgICAgICAgIG5ld05vdGVzRm9sZGVyRWwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICAgICAgICAgIG9wZW5GaWxlICYmIG5ld0ZpbGUucGF0aCA9PT0gb3BlbkZpbGUucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgIXRoaXMuYWN0aXZlRm9sZGVycy5oYXMoXCJOZXdcIilcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLnNjaGVkdWxlZE5vdGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxldCBub3c6IG51bWJlciA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBsZXQgY3VyclVuaXggPSAtMTtcbiAgICAgICAgICAgIGxldCBmb2xkZXJFbCwgZm9sZGVyVGl0bGU7XG4gICAgICAgICAgICBsZXQgbWF4RGF5c1RvUmVuZGVyID0gZ2V0U2V0dGluZyhcbiAgICAgICAgICAgICAgICBcIm1heE5EYXlzTm90ZXNSZXZpZXdRdWV1ZVwiLFxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmRhdGEuc2V0dGluZ3NcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGZvciAobGV0IHNOb3RlIG9mIHRoaXMucGx1Z2luLnNjaGVkdWxlZE5vdGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNOb3RlLmR1ZVVuaXggIT0gY3VyclVuaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5EYXlzID0gTWF0aC5jZWlsKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHNOb3RlLmR1ZVVuaXggLSBub3cpIC8gKDI0ICogMzYwMCAqIDEwMDApXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5EYXlzID4gbWF4RGF5c1RvUmVuZGVyKSBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBmb2xkZXJUaXRsZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBuRGF5cyA9PSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJZZXN0ZXJkYXlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbkRheXMgPT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJUb2RheVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBuRGF5cyA9PSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcIlRvbW9ycm93XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG5ldyBEYXRlKHNOb3RlLmR1ZVVuaXgpLnRvRGF0ZVN0cmluZygpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlckVsID0gdGhpcy5jcmVhdGVSaWdodFBhbmVGb2xkZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbkVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9sZGVyVGl0bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAhdGhpcy5hY3RpdmVGb2xkZXJzLmhhcyhmb2xkZXJUaXRsZSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgY3VyclVuaXggPSBzTm90ZS5kdWVVbml4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlUmlnaHRQYW5lRmlsZShcbiAgICAgICAgICAgICAgICAgICAgZm9sZGVyRWwsXG4gICAgICAgICAgICAgICAgICAgIHNOb3RlLm5vdGUsXG4gICAgICAgICAgICAgICAgICAgIG9wZW5GaWxlICYmIHNOb3RlLm5vdGUucGF0aCA9PT0gb3BlbkZpbGUucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgIXRoaXMuYWN0aXZlRm9sZGVycy5oYXMoZm9sZGVyVGl0bGUpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRlbnRFbCA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV07XG4gICAgICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgICAgICBjb250ZW50RWwuYXBwZW5kQ2hpbGQocm9vdEVsKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVJpZ2h0UGFuZUZvbGRlcihcbiAgICAgICAgcGFyZW50RWw6IGFueSxcbiAgICAgICAgZm9sZGVyVGl0bGU6IHN0cmluZyxcbiAgICAgICAgY29sbGFwc2VkOiBib29sZWFuXG4gICAgKTogYW55IHtcbiAgICAgICAgY29uc3QgZm9sZGVyRWwgPSBwYXJlbnRFbC5jcmVhdGVEaXYoXCJuYXYtZm9sZGVyXCIpO1xuICAgICAgICBjb25zdCBmb2xkZXJUaXRsZUVsID0gZm9sZGVyRWwuY3JlYXRlRGl2KFwibmF2LWZvbGRlci10aXRsZVwiKTtcbiAgICAgICAgY29uc3QgY2hpbGRyZW5FbCA9IGZvbGRlckVsLmNyZWF0ZURpdihcIm5hdi1mb2xkZXItY2hpbGRyZW5cIik7XG4gICAgICAgIGNvbnN0IGNvbGxhcHNlSWNvbkVsID0gZm9sZGVyVGl0bGVFbC5jcmVhdGVEaXYoXG4gICAgICAgICAgICBcIm5hdi1mb2xkZXItY29sbGFwc2UtaW5kaWNhdG9yIGNvbGxhcHNlLWljb25cIlxuICAgICAgICApO1xuICAgICAgICBjb2xsYXBzZUljb25FbC5pbm5lckhUTUwgPSBDT0xMQVBTRV9JQ09OO1xuXG4gICAgICAgIGlmIChjb2xsYXBzZWQpXG4gICAgICAgICAgICBjb2xsYXBzZUljb25FbC5jaGlsZE5vZGVzWzBdLnN0eWxlLnRyYW5zZm9ybSA9IFwicm90YXRlKC05MGRlZylcIjtcblxuICAgICAgICBmb2xkZXJUaXRsZUVsXG4gICAgICAgICAgICAuY3JlYXRlRGl2KFwibmF2LWZvbGRlci10aXRsZS1jb250ZW50XCIpXG4gICAgICAgICAgICAuc2V0VGV4dChmb2xkZXJUaXRsZSk7XG5cbiAgICAgICAgZm9sZGVyVGl0bGVFbC5vbkNsaWNrRXZlbnQoKF86IGFueSkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgY2hpbGQgb2YgY2hpbGRyZW5FbC5jaGlsZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5zdHlsZS5kaXNwbGF5ID09IFwiYmxvY2tcIiB8fFxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5zdHlsZS5kaXNwbGF5ID09IFwiXCJcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICBjb2xsYXBzZUljb25FbC5jaGlsZE5vZGVzWzBdLnN0eWxlLnRyYW5zZm9ybSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBcInJvdGF0ZSgtOTBkZWcpXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlRm9sZGVycy5kZWxldGUoZm9sZGVyVGl0bGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxhcHNlSWNvbkVsLmNoaWxkTm9kZXNbMF0uc3R5bGUudHJhbnNmb3JtID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVGb2xkZXJzLmFkZChmb2xkZXJUaXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gY2hpbGRyZW5FbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVJpZ2h0UGFuZUZpbGUoXG4gICAgICAgIGZvbGRlckVsOiBhbnksXG4gICAgICAgIGZpbGU6IFRGaWxlLFxuICAgICAgICBmaWxlRWxBY3RpdmU6IGJvb2xlYW4sXG4gICAgICAgIGhpZGRlbjogYm9vbGVhblxuICAgICkge1xuICAgICAgICBjb25zdCBuYXZGaWxlRWwgPSBmb2xkZXJFbC5jcmVhdGVEaXYoXCJuYXYtZmlsZVwiKTtcbiAgICAgICAgaWYgKGhpZGRlbikgbmF2RmlsZUVsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICAgICAgICBjb25zdCBuYXZGaWxlVGl0bGUgPSBuYXZGaWxlRWwuY3JlYXRlRGl2KFwibmF2LWZpbGUtdGl0bGVcIik7XG4gICAgICAgIGlmIChmaWxlRWxBY3RpdmUpIG5hdkZpbGVUaXRsZS5hZGRDbGFzcyhcImlzLWFjdGl2ZVwiKTtcblxuICAgICAgICBuYXZGaWxlVGl0bGUuY3JlYXRlRGl2KFwibmF2LWZpbGUtdGl0bGUtY29udGVudFwiKS5zZXRUZXh0KGZpbGUuYmFzZW5hbWUpO1xuICAgICAgICBuYXZGaWxlVGl0bGUuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAgIFwiY2xpY2tcIixcbiAgICAgICAgICAgIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG5cbiAgICAgICAgbmF2RmlsZVRpdGxlLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgICBcImNvbnRleHRtZW51XCIsXG4gICAgICAgICAgICAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVNZW51ID0gbmV3IE1lbnUodGhpcy5hcHApO1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS50cmlnZ2VyKFxuICAgICAgICAgICAgICAgICAgICBcImZpbGUtbWVudVwiLFxuICAgICAgICAgICAgICAgICAgICBmaWxlTWVudSxcbiAgICAgICAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgXCJteS1jb250ZXh0LW1lbnVcIixcbiAgICAgICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgZmlsZU1lbnUuc2hvd0F0UG9zaXRpb24oe1xuICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCxcbiAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtcclxuICAgIE5vdGljZSxcclxuICAgIFBsdWdpbixcclxuICAgIGFkZEljb24sXHJcbiAgICBURmlsZSxcclxuICAgIEhlYWRpbmdDYWNoZSxcclxuICAgIGdldEFsbFRhZ3MsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCAqIGFzIGdyYXBoIGZyb20gXCJwYWdlcmFuay5qc1wiO1xyXG5pbXBvcnQgeyBTUlNldHRpbmdUYWIsIERFRkFVTFRfU0VUVElOR1MsIGdldFNldHRpbmcgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xyXG5pbXBvcnQgeyBGbGFzaGNhcmRNb2RhbCB9IGZyb20gXCIuL2ZsYXNoY2FyZC1tb2RhbFwiO1xyXG5pbXBvcnQgeyBSZXZpZXdRdWV1ZUxpc3RWaWV3LCBSRVZJRVdfUVVFVUVfVklFV19UWVBFIH0gZnJvbSBcIi4vc2lkZWJhclwiO1xyXG5pbXBvcnQgeyBzY2hlZHVsZSB9IGZyb20gXCIuL3NjaGVkXCI7XHJcbmltcG9ydCB7XHJcbiAgICBTY2hlZE5vdGUsXHJcbiAgICBMaW5rU3RhdCxcclxuICAgIENhcmQsXHJcbiAgICBDYXJkVHlwZSxcclxuICAgIFJldmlld1Jlc3BvbnNlLFxyXG4gICAgU1JTZXR0aW5ncyxcclxufSBmcm9tIFwiLi90eXBlc1wiO1xyXG5pbXBvcnQge1xyXG4gICAgQ1JPU1NfSEFJUlNfSUNPTixcclxuICAgIFNDSEVEVUxJTkdfSU5GT19SRUdFWCxcclxuICAgIFlBTUxfRlJPTlRfTUFUVEVSX1JFR0VYLFxyXG4gICAgQ0xPWkVfQ0FSRF9ERVRFQ1RPUixcclxuICAgIENMT1pFX0RFTEVUSU9OU19FWFRSQUNUT1IsXHJcbiAgICBDTE9aRV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUixcclxuICAgIFdJS0lMSU5LX01FRElBX1JFR0VYLFxyXG4gICAgTUFSS0RPV05fTElOS19NRURJQV9SRUdFWCxcclxuICAgIENPREVCTE9DS19SRUdFWCxcclxuICAgIElOTElORV9DT0RFX1JFR0VYLFxyXG59IGZyb20gXCIuL2NvbnN0YW50c1wiO1xyXG5pbXBvcnQgeyBlc2NhcGVSZWdleFN0cmluZyB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgUGx1Z2luRGF0YSB7XHJcbiAgICBzZXR0aW5nczogU1JTZXR0aW5ncztcclxufVxyXG5cclxuY29uc3QgREVGQVVMVF9EQVRBOiBQbHVnaW5EYXRhID0ge1xyXG4gICAgc2V0dGluZ3M6IERFRkFVTFRfU0VUVElOR1MsXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTUlBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XHJcbiAgICBwcml2YXRlIHN0YXR1c0JhcjogSFRNTEVsZW1lbnQ7XHJcbiAgICBwcml2YXRlIHJldmlld1F1ZXVlVmlldzogUmV2aWV3UXVldWVMaXN0VmlldztcclxuICAgIHB1YmxpYyBkYXRhOiBQbHVnaW5EYXRhO1xyXG5cclxuICAgIHB1YmxpYyBuZXdOb3RlczogVEZpbGVbXSA9IFtdO1xyXG4gICAgcHVibGljIHNjaGVkdWxlZE5vdGVzOiBTY2hlZE5vdGVbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBlYXNlQnlQYXRoOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XHJcbiAgICBwcml2YXRlIGluY29taW5nTGlua3M6IFJlY29yZDxzdHJpbmcsIExpbmtTdGF0W10+ID0ge307XHJcbiAgICBwcml2YXRlIHBhZ2VyYW5rczogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBkdWVOb3Rlc0NvdW50OiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBuZXdGbGFzaGNhcmRzOiBSZWNvcmQ8c3RyaW5nLCBDYXJkW10+ID0ge307IC8vIDxkZWNrIG5hbWUsIENhcmRbXT5cclxuICAgIHB1YmxpYyBuZXdGbGFzaGNhcmRzQ291bnQ6IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgZHVlRmxhc2hjYXJkczogUmVjb3JkPHN0cmluZywgQ2FyZFtdPiA9IHt9OyAvLyA8ZGVjayBuYW1lLCBDYXJkW10+XHJcbiAgICBwdWJsaWMgZHVlRmxhc2hjYXJkc0NvdW50OiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBzaW5nbGVsaW5lQ2FyZFJlZ2V4OiBSZWdFeHA7XHJcbiAgICBwdWJsaWMgbXVsdGlsaW5lQ2FyZFJlZ2V4OiBSZWdFeHA7XHJcblxyXG4gICAgYXN5bmMgb25sb2FkKCkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFBsdWdpbkRhdGEoKTtcclxuXHJcbiAgICAgICAgYWRkSWNvbihcImNyb3NzaGFpcnNcIiwgQ1JPU1NfSEFJUlNfSUNPTik7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gdGhpcy5hZGRTdGF0dXNCYXJJdGVtKCk7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIuY2xhc3NMaXN0LmFkZChcIm1vZC1jbGlja2FibGVcIik7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBcIk9wZW4gYSBub3RlIGZvciByZXZpZXdcIik7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbC1wb3NpdGlvblwiLCBcInRvcFwiKTtcclxuICAgICAgICB0aGlzLnN0YXR1c0Jhci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKF86IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnN5bmMoKTtcclxuICAgICAgICAgICAgdGhpcy5yZXZpZXdOZXh0Tm90ZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnNpbmdsZWxpbmVDYXJkUmVnZXggPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICBgXiguKykke2VzY2FwZVJlZ2V4U3RyaW5nKFxyXG4gICAgICAgICAgICAgICAgZ2V0U2V0dGluZyhcInNpbmdsZWxpbmVDYXJkU2VwYXJhdG9yXCIsIHRoaXMuZGF0YS5zZXR0aW5ncylcclxuICAgICAgICAgICAgKX0oLis/KVxcXFxuPyg/OjwhLS1TUjooLispLChcXFxcZCspLChcXFxcZCspLS0+fCQpYCxcclxuICAgICAgICAgICAgXCJnbVwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdGhpcy5tdWx0aWxpbmVDYXJkUmVnZXggPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICBgXigoPzouK1xcXFxuKSspJHtlc2NhcGVSZWdleFN0cmluZyhcclxuICAgICAgICAgICAgICAgIGdldFNldHRpbmcoXCJtdWx0aWxpbmVDYXJkU2VwYXJhdG9yXCIsIHRoaXMuZGF0YS5zZXR0aW5ncylcclxuICAgICAgICAgICAgKX1cXFxcbigoPzouKz9cXFxcbj8pKz8pKD86PCEtLVNSOiguKyksKFxcXFxkKyksKFxcXFxkKyktLT58JClgLFxyXG4gICAgICAgICAgICBcImdtXCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJjcm9zc2hhaXJzXCIsIFwiUmV2aWV3IGZsYXNoY2FyZHNcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmZsYXNoY2FyZHNfc3luYygpO1xyXG4gICAgICAgICAgICBuZXcgRmxhc2hjYXJkTW9kYWwodGhpcy5hcHAsIHRoaXMpLm9wZW4oKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3RlclZpZXcoXHJcbiAgICAgICAgICAgIFJFVklFV19RVUVVRV9WSUVXX1RZUEUsXHJcbiAgICAgICAgICAgIChsZWFmKSA9PlxyXG4gICAgICAgICAgICAgICAgKHRoaXMucmV2aWV3UXVldWVWaWV3ID0gbmV3IFJldmlld1F1ZXVlTGlzdFZpZXcobGVhZiwgdGhpcykpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmRhdGEuc2V0dGluZ3MuZGlzYWJsZUZpbGVNZW51UmV2aWV3T3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW1lbnVcIiwgKG1lbnUsIGZpbGU6IFRGaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2V0VGl0bGUoXCJSZXZpZXc6IEVhc3lcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwiY3Jvc3NoYWlyc1wiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKGV2dCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbiA9PSBcIm1kXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVJldmlld1Jlc3BvbnNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJldmlld1Jlc3BvbnNlLkVhc3lcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZW51LmFkZEl0ZW0oKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXRUaXRsZShcIlJldmlldzogR29vZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJjcm9zc2hhaXJzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUuZXh0ZW5zaW9uID09IFwibWRcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUmV2aWV3UmVzcG9uc2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmV2aWV3UmVzcG9uc2UuR29vZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNldFRpdGxlKFwiUmV2aWV3OiBIYXJkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcImNyb3NzaGFpcnNcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKChldnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZS5leHRlbnNpb24gPT0gXCJtZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVSZXZpZXdSZXNwb25zZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZXZpZXdSZXNwb25zZS5IYXJkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJzcnMtbm90ZS1yZXZpZXctb3Blbi1ub3RlXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiT3BlbiBhIG5vdGUgZm9yIHJldmlld1wiLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zeW5jKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJldmlld05leHROb3RlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcInNycy1ub3RlLXJldmlldy1lYXN5XCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUmV2aWV3IG5vdGUgYXMgZWFzeVwiLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3BlbkZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wZW5GaWxlICYmIG9wZW5GaWxlLmV4dGVuc2lvbiA9PSBcIm1kXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlUmV2aWV3UmVzcG9uc2Uob3BlbkZpbGUsIFJldmlld1Jlc3BvbnNlLkVhc3kpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJzcnMtbm90ZS1yZXZpZXctZ29vZFwiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIlJldmlldyBub3RlIGFzIGdvb2RcIixcclxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9wZW5GaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcGVuRmlsZSAmJiBvcGVuRmlsZS5leHRlbnNpb24gPT0gXCJtZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVJldmlld1Jlc3BvbnNlKG9wZW5GaWxlLCBSZXZpZXdSZXNwb25zZS5Hb29kKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgaWQ6IFwic3JzLW5vdGUtcmV2aWV3LWhhcmRcIixcclxuICAgICAgICAgICAgbmFtZTogXCJSZXZpZXcgbm90ZSBhcyBoYXJkXCIsXHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcGVuRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAob3BlbkZpbGUgJiYgb3BlbkZpbGUuZXh0ZW5zaW9uID09IFwibWRcIilcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVSZXZpZXdSZXNwb25zZShvcGVuRmlsZSwgUmV2aWV3UmVzcG9uc2UuSGFyZCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcInNycy1yZXZpZXctZmxhc2hjYXJkc1wiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIlJldmlldyBmbGFzaGNhcmRzXCIsXHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZsYXNoY2FyZHNfc3luYygpO1xyXG4gICAgICAgICAgICAgICAgbmV3IEZsYXNoY2FyZE1vZGFsKHRoaXMuYXBwLCB0aGlzKS5vcGVuKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU1JTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5pbml0VmlldygpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc3luYygpLCAyMDAwKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmZsYXNoY2FyZHNfc3luYygpLCAyMDAwKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbnVubG9hZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2VcclxuICAgICAgICAgICAgLmdldExlYXZlc09mVHlwZShSRVZJRVdfUVVFVUVfVklFV19UWVBFKVxyXG4gICAgICAgICAgICAuZm9yRWFjaCgobGVhZikgPT4gbGVhZi5kZXRhY2goKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc3luYygpIHtcclxuICAgICAgICBsZXQgbm90ZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XHJcblxyXG4gICAgICAgIGdyYXBoLnJlc2V0KCk7XHJcbiAgICAgICAgdGhpcy5zY2hlZHVsZWROb3RlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZWFzZUJ5UGF0aCA9IHt9O1xyXG4gICAgICAgIHRoaXMubmV3Tm90ZXMgPSBbXTtcclxuICAgICAgICB0aGlzLmluY29taW5nTGlua3MgPSB7fTtcclxuICAgICAgICB0aGlzLnBhZ2VyYW5rcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZHVlTm90ZXNDb3VudCA9IDA7XHJcblxyXG4gICAgICAgIGxldCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGZvciAobGV0IG5vdGUgb2Ygbm90ZXMpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaW5jb21pbmdMaW5rc1tub3RlLnBhdGhdID09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5jb21pbmdMaW5rc1tub3RlLnBhdGhdID0gW107XHJcblxyXG4gICAgICAgICAgICBsZXQgbGlua3MgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLnJlc29sdmVkTGlua3Nbbm90ZS5wYXRoXSB8fCB7fTtcclxuICAgICAgICAgICAgZm9yIChsZXQgdGFyZ2V0UGF0aCBpbiBsaW5rcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5jb21pbmdMaW5rc1t0YXJnZXRQYXRoXSA9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmNvbWluZ0xpbmtzW3RhcmdldFBhdGhdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbWFya2Rvd24gZmlsZXMgb25seVxyXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBhdGguc3BsaXQoXCIuXCIpLnBvcCgpLnRvTG93ZXJDYXNlKCkgPT0gXCJtZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmNvbWluZ0xpbmtzW3RhcmdldFBhdGhdLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VQYXRoOiBub3RlLnBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtDb3VudDogbGlua3NbdGFyZ2V0UGF0aF0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoLmxpbmsobm90ZS5wYXRoLCB0YXJnZXRQYXRoLCBsaW5rc1t0YXJnZXRQYXRoXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBmaWxlQ2FjaGVkRGF0YSA9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShub3RlKSB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGxldCBmcm9udG1hdHRlciA9XHJcbiAgICAgICAgICAgICAgICBmaWxlQ2FjaGVkRGF0YS5mcm9udG1hdHRlciB8fCA8UmVjb3JkPHN0cmluZywgYW55Pj57fTtcclxuICAgICAgICAgICAgbGV0IHRhZ3MgPSBnZXRBbGxUYWdzKGZpbGVDYWNoZWREYXRhKSB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzaG91bGRJZ25vcmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCB0YWcgb2YgdGFncykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5zZXR0aW5ncy50YWdzVG9SZXZpZXcuaW5jbHVkZXModGFnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3VsZElnbm9yZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2hvdWxkSWdub3JlKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGZpbGUgaGFzIG5vIHNjaGVkdWxpbmcgaW5mb3JtYXRpb25cclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgIShcclxuICAgICAgICAgICAgICAgICAgICBmcm9udG1hdHRlci5oYXNPd25Qcm9wZXJ0eShcInNyLWR1ZVwiKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGZyb250bWF0dGVyLmhhc093blByb3BlcnR5KFwic3ItaW50ZXJ2YWxcIikgJiZcclxuICAgICAgICAgICAgICAgICAgICBmcm9udG1hdHRlci5oYXNPd25Qcm9wZXJ0eShcInNyLWVhc2VcIilcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5ld05vdGVzLnB1c2gobm90ZSk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGR1ZVVuaXg6IG51bWJlciA9IHdpbmRvd1xyXG4gICAgICAgICAgICAgICAgLm1vbWVudChmcm9udG1hdHRlcltcInNyLWR1ZVwiXSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiWVlZWS1NTS1ERFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiREQtTU0tWVlZWVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZGRkIE1NTSBERCBZWVlZXCIsXHJcbiAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZWROb3Rlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIG5vdGUsXHJcbiAgICAgICAgICAgICAgICBkdWVVbml4LFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWFzZUJ5UGF0aFtub3RlLnBhdGhdID0gZnJvbnRtYXR0ZXJbXCJzci1lYXNlXCJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGR1ZVVuaXggPD0gbm93KSB0aGlzLmR1ZU5vdGVzQ291bnQrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdyYXBoLnJhbmsoMC44NSwgMC4wMDAwMDEsIChub2RlOiBzdHJpbmcsIHJhbms6IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnBhZ2VyYW5rc1tub2RlXSA9IHJhbmsgKiAxMDAwMDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gc29ydCBuZXcgbm90ZXMgYnkgaW1wb3J0YW5jZVxyXG4gICAgICAgIHRoaXMubmV3Tm90ZXMgPSB0aGlzLm5ld05vdGVzLnNvcnQoXHJcbiAgICAgICAgICAgIChhOiBURmlsZSwgYjogVEZpbGUpID0+XHJcbiAgICAgICAgICAgICAgICAodGhpcy5wYWdlcmFua3NbYi5wYXRoXSB8fCAwKSAtICh0aGlzLnBhZ2VyYW5rc1thLnBhdGhdIHx8IDApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gc29ydCBzY2hlZHVsZWQgbm90ZXMgYnkgZGF0ZSAmIHdpdGhpbiB0aG9zZSBkYXlzLCBzb3J0IHRoZW0gYnkgaW1wb3J0YW5jZVxyXG4gICAgICAgIHRoaXMuc2NoZWR1bGVkTm90ZXMgPSB0aGlzLnNjaGVkdWxlZE5vdGVzLnNvcnQoXHJcbiAgICAgICAgICAgIChhOiBTY2hlZE5vdGUsIGI6IFNjaGVkTm90ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGEuZHVlVW5peCAtIGIuZHVlVW5peDtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT0gMCkgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMucGFnZXJhbmtzW2Iubm90ZS5wYXRoXSB8fCAwKSAtXHJcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMucGFnZXJhbmtzW2Eubm90ZS5wYXRoXSB8fCAwKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxldCBub3RlQ291bnRUZXh0ID0gdGhpcy5kdWVOb3Rlc0NvdW50ID09IDEgPyBcIm5vdGVcIiA6IFwibm90ZXNcIjtcclxuICAgICAgICBsZXQgY2FyZENvdW50VGV4dCA9IHRoaXMuZHVlRmxhc2hjYXJkc0NvdW50ID09IDEgPyBcImNhcmRcIiA6IFwiY2FyZHNcIjtcclxuICAgICAgICB0aGlzLnN0YXR1c0Jhci5zZXRUZXh0KFxyXG4gICAgICAgICAgICBgUmV2aWV3OiAke3RoaXMuZHVlTm90ZXNDb3VudH0gJHtub3RlQ291bnRUZXh0fSwgJHt0aGlzLmR1ZUZsYXNoY2FyZHNDb3VudH0gJHtjYXJkQ291bnRUZXh0fSBkdWVgXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnJldmlld1F1ZXVlVmlldy5yZWRyYXcoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlUmV2aWV3UmVzcG9uc2Uobm90ZTogVEZpbGUsIHJlc3BvbnNlOiBSZXZpZXdSZXNwb25zZSkge1xyXG4gICAgICAgIGxldCBmaWxlQ2FjaGVkRGF0YSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKG5vdGUpIHx8IHt9O1xyXG4gICAgICAgIGxldCBmcm9udG1hdHRlciA9IGZpbGVDYWNoZWREYXRhLmZyb250bWF0dGVyIHx8IDxSZWNvcmQ8c3RyaW5nLCBhbnk+Pnt9O1xyXG5cclxuICAgICAgICBsZXQgdGFncyA9IGdldEFsbFRhZ3MoZmlsZUNhY2hlZERhdGEpIHx8IFtdO1xyXG4gICAgICAgIGxldCBzaG91bGRJZ25vcmUgPSB0cnVlO1xyXG4gICAgICAgIGZvciAobGV0IHRhZyBvZiB0YWdzKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGEuc2V0dGluZ3MudGFnc1RvUmV2aWV3LmluY2x1ZGVzKHRhZykpIHtcclxuICAgICAgICAgICAgICAgIHNob3VsZElnbm9yZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzaG91bGRJZ25vcmUpIHtcclxuICAgICAgICAgICAgbmV3IE5vdGljZShcclxuICAgICAgICAgICAgICAgIFwiUGxlYXNlIHRhZyB0aGUgbm90ZSBhcHByb3ByaWF0ZWx5IGZvciByZXZpZXdpbmcgKGluIHNldHRpbmdzKS5cIlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZmlsZVRleHQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKG5vdGUpO1xyXG4gICAgICAgIGxldCBlYXNlLCBpbnRlcnZhbDtcclxuICAgICAgICAvLyBuZXcgbm90ZVxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgIShcclxuICAgICAgICAgICAgICAgIGZyb250bWF0dGVyLmhhc093blByb3BlcnR5KFwic3ItZHVlXCIpICYmXHJcbiAgICAgICAgICAgICAgICBmcm9udG1hdHRlci5oYXNPd25Qcm9wZXJ0eShcInNyLWludGVydmFsXCIpICYmXHJcbiAgICAgICAgICAgICAgICBmcm9udG1hdHRlci5oYXNPd25Qcm9wZXJ0eShcInNyLWVhc2VcIilcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBsZXQgbGlua1RvdGFsID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbmtQR1RvdGFsID0gMCxcclxuICAgICAgICAgICAgICAgIHRvdGFsTGlua0NvdW50ID0gMDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHN0YXRPYmogb2YgdGhpcy5pbmNvbWluZ0xpbmtzW25vdGUucGF0aF0pIHtcclxuICAgICAgICAgICAgICAgIGxldCBlYXNlID0gdGhpcy5lYXNlQnlQYXRoW3N0YXRPYmouc291cmNlUGF0aF07XHJcbiAgICAgICAgICAgICAgICBpZiAoZWFzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtUb3RhbCArPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0T2JqLmxpbmtDb3VudCAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFnZXJhbmtzW3N0YXRPYmouc291cmNlUGF0aF0gKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtQR1RvdGFsICs9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFnZXJhbmtzW3N0YXRPYmouc291cmNlUGF0aF0gKiBzdGF0T2JqLmxpbmtDb3VudDtcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbExpbmtDb3VudCArPSBzdGF0T2JqLmxpbmtDb3VudDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG91dGdvaW5nTGlua3MgPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5yZXNvbHZlZExpbmtzW25vdGUucGF0aF0gfHwge307XHJcbiAgICAgICAgICAgIGZvciAobGV0IGxpbmtlZEZpbGVQYXRoIGluIG91dGdvaW5nTGlua3MpIHtcclxuICAgICAgICAgICAgICAgIGxldCBlYXNlID0gdGhpcy5lYXNlQnlQYXRoW2xpbmtlZEZpbGVQYXRoXTtcclxuICAgICAgICAgICAgICAgIGlmIChlYXNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlua1RvdGFsICs9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGdvaW5nTGlua3NbbGlua2VkRmlsZVBhdGhdICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWdlcmFua3NbbGlua2VkRmlsZVBhdGhdICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFzZTtcclxuICAgICAgICAgICAgICAgICAgICBsaW5rUEdUb3RhbCArPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhZ2VyYW5rc1tsaW5rZWRGaWxlUGF0aF0gKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRnb2luZ0xpbmtzW2xpbmtlZEZpbGVQYXRoXTtcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbExpbmtDb3VudCArPSBvdXRnb2luZ0xpbmtzW2xpbmtlZEZpbGVQYXRoXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGxpbmtDb250cmlidXRpb24gPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLnNldHRpbmdzLm1heExpbmtGYWN0b3IgKlxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4oMS4wLCBNYXRoLmxvZyh0b3RhbExpbmtDb3VudCArIDAuNSkgLyBNYXRoLmxvZyg2NCkpO1xyXG4gICAgICAgICAgICBlYXNlID0gTWF0aC5yb3VuZChcclxuICAgICAgICAgICAgICAgICgxLjAgLSBsaW5rQ29udHJpYnV0aW9uKSAqIHRoaXMuZGF0YS5zZXR0aW5ncy5iYXNlRWFzZSArXHJcbiAgICAgICAgICAgICAgICAgICAgKHRvdGFsTGlua0NvdW50ID4gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IChsaW5rQ29udHJpYnV0aW9uICogbGlua1RvdGFsKSAvIGxpbmtQR1RvdGFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbGlua0NvbnRyaWJ1dGlvbiAqIHRoaXMuZGF0YS5zZXR0aW5ncy5iYXNlRWFzZSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaW50ZXJ2YWwgPSAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGludGVydmFsID0gZnJvbnRtYXR0ZXJbXCJzci1pbnRlcnZhbFwiXTtcclxuICAgICAgICAgICAgZWFzZSA9IGZyb250bWF0dGVyW1wic3ItZWFzZVwiXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzY2hlZE9iaiA9IHNjaGVkdWxlKFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgaW50ZXJ2YWwsXHJcbiAgICAgICAgICAgIGVhc2UsXHJcbiAgICAgICAgICAgIHRydWUsXHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zZXR0aW5nc1xyXG4gICAgICAgICk7XHJcbiAgICAgICAgaW50ZXJ2YWwgPSBNYXRoLnJvdW5kKHNjaGVkT2JqLmludGVydmFsKTtcclxuICAgICAgICBlYXNlID0gc2NoZWRPYmouZWFzZTtcclxuXHJcbiAgICAgICAgbGV0IGR1ZSA9IHdpbmRvdy5tb21lbnQoRGF0ZS5ub3coKSArIGludGVydmFsICogMjQgKiAzNjAwICogMTAwMCk7XHJcbiAgICAgICAgbGV0IGR1ZVN0cmluZyA9IGR1ZS5mb3JtYXQoXCJZWVlZLU1NLUREXCIpO1xyXG5cclxuICAgICAgICAvLyBjaGVjayBpZiBzY2hlZHVsaW5nIGluZm8gZXhpc3RzXHJcbiAgICAgICAgaWYgKFNDSEVEVUxJTkdfSU5GT19SRUdFWC50ZXN0KGZpbGVUZXh0KSkge1xyXG4gICAgICAgICAgICBsZXQgc2NoZWR1bGluZ0luZm8gPSBTQ0hFRFVMSU5HX0lORk9fUkVHRVguZXhlYyhmaWxlVGV4dCk7XHJcbiAgICAgICAgICAgIGZpbGVUZXh0ID0gZmlsZVRleHQucmVwbGFjZShcclxuICAgICAgICAgICAgICAgIFNDSEVEVUxJTkdfSU5GT19SRUdFWCxcclxuICAgICAgICAgICAgICAgIGAtLS1cXG4ke3NjaGVkdWxpbmdJbmZvWzFdfXNyLWR1ZTogJHtkdWVTdHJpbmd9XFxuc3ItaW50ZXJ2YWw6ICR7aW50ZXJ2YWx9XFxuc3ItZWFzZTogJHtlYXNlfVxcbiR7c2NoZWR1bGluZ0luZm9bNV19LS0tYFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgLy8gbmV3IG5vdGUgd2l0aCBleGlzdGluZyBZQU1MIGZyb250IG1hdHRlclxyXG4gICAgICAgIH0gZWxzZSBpZiAoWUFNTF9GUk9OVF9NQVRURVJfUkVHRVgudGVzdChmaWxlVGV4dCkpIHtcclxuICAgICAgICAgICAgbGV0IGV4aXN0aW5nWWFtbCA9IFlBTUxfRlJPTlRfTUFUVEVSX1JFR0VYLmV4ZWMoZmlsZVRleHQpO1xyXG4gICAgICAgICAgICBmaWxlVGV4dCA9IGZpbGVUZXh0LnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICBZQU1MX0ZST05UX01BVFRFUl9SRUdFWCxcclxuICAgICAgICAgICAgICAgIGAtLS1cXG4ke2V4aXN0aW5nWWFtbFsxXX1zci1kdWU6ICR7ZHVlU3RyaW5nfVxcbnNyLWludGVydmFsOiAke2ludGVydmFsfVxcbnNyLWVhc2U6ICR7ZWFzZX1cXG4tLS1gXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmlsZVRleHQgPSBgLS0tXFxuc3ItZHVlOiAke2R1ZVN0cmluZ31cXG5zci1pbnRlcnZhbDogJHtpbnRlcnZhbH1cXG5zci1lYXNlOiAke2Vhc2V9XFxuLS0tXFxuXFxuJHtmaWxlVGV4dH1gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHAudmF1bHQubW9kaWZ5KG5vdGUsIGZpbGVUZXh0KTtcclxuXHJcbiAgICAgICAgbmV3IE5vdGljZShcIlJlc3BvbnNlIHJlY2VpdmVkLlwiKTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc3luYygpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRhLnNldHRpbmdzLmF1dG9OZXh0Tm90ZSkgdGhpcy5yZXZpZXdOZXh0Tm90ZSgpO1xyXG4gICAgICAgIH0sIDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmV2aWV3TmV4dE5vdGUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHVlTm90ZXNDb3VudCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5kYXRhLnNldHRpbmdzLm9wZW5SYW5kb21Ob3RlXHJcbiAgICAgICAgICAgICAgICA/IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMuZHVlTm90ZXNDb3VudClcclxuICAgICAgICAgICAgICAgIDogMDtcclxuICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWYub3BlbkZpbGUoXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNjaGVkdWxlZE5vdGVzW2luZGV4XS5ub3RlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5ld05vdGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5kYXRhLnNldHRpbmdzLm9wZW5SYW5kb21Ob3RlXHJcbiAgICAgICAgICAgICAgICA/IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHRoaXMubmV3Tm90ZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgOiAwO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZi5vcGVuRmlsZSh0aGlzLm5ld05vdGVzW2luZGV4XSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5ldyBOb3RpY2UoXCJZb3UncmUgZG9uZSBmb3IgdGhlIGRheSA6RC5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZmxhc2hjYXJkc19zeW5jKCkge1xyXG4gICAgICAgIGxldCBub3RlcyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzID0ge307XHJcbiAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkc0NvdW50ID0gMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbm90ZSBvZiBub3Rlcykge1xyXG4gICAgICAgICAgICBsZXQgZmlsZUNhY2hlZERhdGEgPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUobm90ZSkgfHwge307XHJcbiAgICAgICAgICAgIGxldCBmcm9udG1hdHRlciA9XHJcbiAgICAgICAgICAgICAgICBmaWxlQ2FjaGVkRGF0YS5mcm9udG1hdHRlciB8fCA8UmVjb3JkPHN0cmluZywgYW55Pj57fTtcclxuICAgICAgICAgICAgbGV0IHRhZ3MgPSBnZXRBbGxUYWdzKGZpbGVDYWNoZWREYXRhKSB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHRhZyBvZiB0YWdzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhLnNldHRpbmdzLmZsYXNoY2FyZFRhZ3MuaW5jbHVkZXModGFnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZmluZEZsYXNoY2FyZHMobm90ZSwgdGFnKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc29ydCB0aGUgZGVjayBuYW1lc1xyXG4gICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkcyA9IE9iamVjdC5rZXlzKHRoaXMuZHVlRmxhc2hjYXJkcylcclxuICAgICAgICAgICAgLnNvcnQoKVxyXG4gICAgICAgICAgICAucmVkdWNlKChvYmo6IFJlY29yZDxzdHJpbmcsIENhcmRbXT4sIGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvYmpba2V5XSA9IHRoaXMuZHVlRmxhc2hjYXJkc1trZXldO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgfSwge30pO1xyXG4gICAgICAgIHRoaXMubmV3Rmxhc2hjYXJkcyA9IE9iamVjdC5rZXlzKHRoaXMubmV3Rmxhc2hjYXJkcylcclxuICAgICAgICAgICAgLnNvcnQoKVxyXG4gICAgICAgICAgICAucmVkdWNlKChvYmo6IFJlY29yZDxzdHJpbmcsIENhcmRbXT4sIGtleTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvYmpba2V5XSA9IHRoaXMubmV3Rmxhc2hjYXJkc1trZXldO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgICAgICAgfSwge30pO1xyXG5cclxuICAgICAgICBsZXQgbm90ZUNvdW50VGV4dCA9IHRoaXMuZHVlTm90ZXNDb3VudCA9PSAxID8gXCJub3RlXCIgOiBcIm5vdGVzXCI7XHJcbiAgICAgICAgbGV0IGNhcmRDb3VudFRleHQgPSB0aGlzLmR1ZUZsYXNoY2FyZHNDb3VudCA9PSAxID8gXCJjYXJkXCIgOiBcImNhcmRzXCI7XHJcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0VGV4dChcclxuICAgICAgICAgICAgYFJldmlldzogJHt0aGlzLmR1ZU5vdGVzQ291bnR9ICR7bm90ZUNvdW50VGV4dH0sICR7dGhpcy5kdWVGbGFzaGNhcmRzQ291bnR9ICR7Y2FyZENvdW50VGV4dH0gZHVlYFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZmluZEZsYXNoY2FyZHMobm90ZTogVEZpbGUsIGRlY2s6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBmaWxlVGV4dCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQobm90ZSk7XHJcbiAgICAgICAgbGV0IGZpbGVDYWNoZWREYXRhID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUobm90ZSkgfHwge307XHJcbiAgICAgICAgbGV0IGhlYWRpbmdzID0gZmlsZUNhY2hlZERhdGEuaGVhZGluZ3MgfHwgW107XHJcbiAgICAgICAgbGV0IGZpbGVDaGFuZ2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5kdWVGbGFzaGNhcmRzLmhhc093blByb3BlcnR5KGRlY2spKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkc1tkZWNrXSA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLm5ld0ZsYXNoY2FyZHNbZGVja10gPSBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZpbmQgYWxsIGNvZGVibG9ja3NcclxuICAgICAgICBsZXQgY29kZWJsb2NrczogW251bWJlciwgbnVtYmVyXVtdID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgcmVnZXggb2YgW0NPREVCTE9DS19SRUdFWCwgSU5MSU5FX0NPREVfUkVHRVhdKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG1hdGNoIG9mIGZpbGVUZXh0Lm1hdGNoQWxsKHJlZ2V4KSlcclxuICAgICAgICAgICAgICAgIGNvZGVibG9ja3MucHVzaChbbWF0Y2guaW5kZXgsIG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbm93ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAvLyBiYXNpYyBjYXJkc1xyXG4gICAgICAgIGZvciAobGV0IHJlZ2V4IG9mIFt0aGlzLnNpbmdsZWxpbmVDYXJkUmVnZXgsIHRoaXMubXVsdGlsaW5lQ2FyZFJlZ2V4XSkge1xyXG4gICAgICAgICAgICBsZXQgY2FyZFR5cGU6IENhcmRUeXBlID1cclxuICAgICAgICAgICAgICAgIHJlZ2V4ID09IHRoaXMuc2luZ2xlbGluZUNhcmRSZWdleFxyXG4gICAgICAgICAgICAgICAgICAgID8gQ2FyZFR5cGUuU2luZ2xlTGluZUJhc2ljXHJcbiAgICAgICAgICAgICAgICAgICAgOiBDYXJkVHlwZS5NdWx0aUxpbmVCYXNpYztcclxuICAgICAgICAgICAgZm9yIChsZXQgbWF0Y2ggb2YgZmlsZVRleHQubWF0Y2hBbGwocmVnZXgpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgaW5Db2RlYmxvY2sobWF0Y2guaW5kZXgsIG1hdGNoWzBdLnRyaW0oKS5sZW5ndGgsIGNvZGVibG9ja3MpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNhcmRUZXh0ID0gbWF0Y2hbMF0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9yaWdpbmFsRnJvbnRUZXh0ID0gbWF0Y2hbMV0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb250ID0gYXdhaXQgdGhpcy5maXhDYXJkTWVkaWFMaW5rcyhcclxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEZyb250VGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBub3RlLnBhdGhcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBsZXQgb3JpZ2luYWxCYWNrVGV4dCA9IG1hdGNoWzJdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGxldCBiYWNrID0gYXdhaXQgdGhpcy5maXhDYXJkTWVkaWFMaW5rcyhcclxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEJhY2tUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIG5vdGUucGF0aFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGxldCBjYXJkT2JqOiBDYXJkO1xyXG4gICAgICAgICAgICAgICAgLy8gZmxhc2hjYXJkIGFscmVhZHkgc2NoZWR1bGVkXHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZHVlVW5peDogbnVtYmVyID0gd2luZG93XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tb21lbnQobWF0Y2hbM10sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiWVlZWS1NTS1ERFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJERC1NTS1ZWVlZXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRkZCBNTU0gREQgWVlZWVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkdWVVbml4IDw9IG5vdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkT2JqID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNEdWU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnZhbDogcGFyc2VJbnQobWF0Y2hbNF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzZTogcGFyc2VJbnQobWF0Y2hbNV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb250LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFjayxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsRnJvbnRUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxCYWNrVGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmR1ZUZsYXNoY2FyZHNbZGVja10ucHVzaChjYXJkT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kdWVGbGFzaGNhcmRzQ291bnQrKztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcmRPYmogPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRHVlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEZyb250VGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxCYWNrVGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld0ZsYXNoY2FyZHNbZGVja10ucHVzaChjYXJkT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld0ZsYXNoY2FyZHNDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChnZXRTZXR0aW5nKFwic2hvd0NvbnRleHRJbkNhcmRzXCIsIHRoaXMuZGF0YS5zZXR0aW5ncykpXHJcbiAgICAgICAgICAgICAgICAgICAgYWRkQ29udGV4dFRvQ2FyZChjYXJkT2JqLCBtYXRjaC5pbmRleCwgaGVhZGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjbG96ZSBkZWxldGlvbiBjYXJkc1xyXG4gICAgICAgIGlmICghZ2V0U2V0dGluZyhcImRpc2FibGVDbG96ZUNhcmRzXCIsIHRoaXMuZGF0YS5zZXR0aW5ncykpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbWF0Y2ggb2YgZmlsZVRleHQubWF0Y2hBbGwoQ0xPWkVfQ0FSRF9ERVRFQ1RPUikpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzBdID0gbWF0Y2hbMF0udHJpbSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjYXJkVGV4dCA9IG1hdGNoWzBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBkZWxldGlvbnM6IFJlZ0V4cE1hdGNoQXJyYXlbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBjYXJkVGV4dC5tYXRjaEFsbChDTE9aRV9ERUxFVElPTlNfRVhUUkFDVE9SKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5Db2RlYmxvY2soXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC5pbmRleCArIG0uaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtWzBdLnRyaW0oKS5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlYmxvY2tzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0aW9ucy5wdXNoKG0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IHNjaGVkdWxpbmc6IFJlZ0V4cE1hdGNoQXJyYXlbXSA9IFtcclxuICAgICAgICAgICAgICAgICAgICAuLi5jYXJkVGV4dC5tYXRjaEFsbChDTE9aRV9TQ0hFRFVMSU5HX0VYVFJBQ1RPUiksXHJcbiAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgc29tZSBleHRyYSBzY2hlZHVsaW5nIGRhdGVzIHRvIGRlbGV0ZVxyXG4gICAgICAgICAgICAgICAgaWYgKHNjaGVkdWxpbmcubGVuZ3RoID4gZGVsZXRpb25zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBpZHhTY2hlZCA9IGNhcmRUZXh0Lmxhc3RJbmRleE9mKFwiPCEtLVNSOlwiKSArIDc7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0NhcmRUZXh0ID0gY2FyZFRleHQuc3Vic3RyaW5nKDAsIGlkeFNjaGVkKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlbGV0aW9ucy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZFRleHQgKz0gYCEke3NjaGVkdWxpbmdbaV1bMV19LCR7c2NoZWR1bGluZ1tpXVsyXX0sJHtzY2hlZHVsaW5nW2ldWzNdfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZFRleHQgKz0gXCItLT5cXG5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlcGxhY2VtZW50UmVnZXggPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlc2NhcGVSZWdleFN0cmluZyhjYXJkVGV4dCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZ21cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVRleHQgPSBmaWxlVGV4dC5yZXBsYWNlKHJlcGxhY2VtZW50UmVnZXgsIG5ld0NhcmRUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlQ2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJlbGF0ZWRDYXJkczogQ2FyZFtdID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlbGV0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjYXJkT2JqOiBDYXJkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZGVsZXRpb25TdGFydCA9IGRlbGV0aW9uc1tpXS5pbmRleDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZGVsZXRpb25FbmQgPSBkZWxldGlvblN0YXJ0ICsgZGVsZXRpb25zW2ldWzBdLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZnJvbnQgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkVGV4dC5zdWJzdHJpbmcoMCwgZGVsZXRpb25TdGFydCkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxzcGFuIHN0eWxlPSdjb2xvcjojMjE5NmYzJz5bLi4uXTwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LnN1YnN0cmluZyhkZWxldGlvbkVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbnQgPSAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZml4Q2FyZE1lZGlhTGlua3MoZnJvbnQsIG5vdGUucGF0aClcclxuICAgICAgICAgICAgICAgICAgICApLnJlcGxhY2UoLz09L2dtLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYmFjayA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0LnN1YnN0cmluZygwLCBkZWxldGlvblN0YXJ0KSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gc3R5bGU9J2NvbG9yOiMyMTk2ZjMnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFRleHQuc3Vic3RyaW5nKGRlbGV0aW9uU3RhcnQsIGRlbGV0aW9uRW5kKSArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9zcGFuPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFRleHQuc3Vic3RyaW5nKGRlbGV0aW9uRW5kKTtcclxuICAgICAgICAgICAgICAgICAgICBiYWNrID0gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZpeENhcmRNZWRpYUxpbmtzKGJhY2ssIG5vdGUucGF0aClcclxuICAgICAgICAgICAgICAgICAgICApLnJlcGxhY2UoLz09L2dtLCBcIlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FyZCBkZWxldGlvbiBzY2hlZHVsZWRcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IHNjaGVkdWxpbmcubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkdWVVbml4OiBudW1iZXIgPSB3aW5kb3dcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tb21lbnQoc2NoZWR1bGluZ1tpXVsxXSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiWVlZWS1NTS1ERFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiREQtTU0tWVlZWVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkdWVVbml4IDw9IG5vdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZE9iaiA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0R1ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnZhbDogcGFyc2VJbnQoc2NoZWR1bGluZ1tpXVsyXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzZTogcGFyc2VJbnQoc2NoZWR1bGluZ1tpXVszXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9udCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0OiBtYXRjaFswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsRnJvbnRUZXh0OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsQmFja1RleHQ6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFR5cGU6IENhcmRUeXBlLkNsb3plLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YkNhcmRJZHg6IGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRlZENhcmRzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmR1ZUZsYXNoY2FyZHNbZGVja10ucHVzaChjYXJkT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHVlRmxhc2hjYXJkc0NvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXcgY2FyZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkT2JqID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNEdWU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb250LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFjayxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRUZXh0OiBtYXRjaFswXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEZyb250VGV4dDogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsQmFja1RleHQ6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkVHlwZTogQ2FyZFR5cGUuQ2xvemUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJDYXJkSWR4OiBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRlZENhcmRzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdGbGFzaGNhcmRzW2RlY2tdLnB1c2goY2FyZE9iaik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV3Rmxhc2hjYXJkc0NvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZWxhdGVkQ2FyZHMucHVzaChjYXJkT2JqKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0U2V0dGluZyhcInNob3dDb250ZXh0SW5DYXJkc1wiLCB0aGlzLmRhdGEuc2V0dGluZ3MpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRDb250ZXh0VG9DYXJkKGNhcmRPYmosIG1hdGNoLmluZGV4LCBoZWFkaW5ncyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmaWxlQ2hhbmdlZCkgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KG5vdGUsIGZpbGVUZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmaXhDYXJkTWVkaWFMaW5rcyhcclxuICAgICAgICBjYXJkVGV4dDogc3RyaW5nLFxyXG4gICAgICAgIGZpbGVQYXRoOiBzdHJpbmdcclxuICAgICk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgZm9yIChsZXQgcmVnZXggb2YgW1dJS0lMSU5LX01FRElBX1JFR0VYLCBNQVJLRE9XTl9MSU5LX01FRElBX1JFR0VYXSkge1xyXG4gICAgICAgICAgICBjYXJkVGV4dCA9IGNhcmRUZXh0LnJlcGxhY2UocmVnZXgsIChtYXRjaCwgaW1hZ2VQYXRoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZnVsbEltYWdlUGF0aCA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0Rmlyc3RMaW5rcGF0aERlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgZGVjb2RlVVJJQ29tcG9uZW50KGltYWdlUGF0aCksXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGhcclxuICAgICAgICAgICAgICAgICkucGF0aDtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgJzxpbWcgc3JjPVwiJyArXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5nZXRSZXNvdXJjZVBhdGgoZnVsbEltYWdlUGF0aCkgK1xyXG4gICAgICAgICAgICAgICAgICAgICdcIiAvPidcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNhcmRUZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGxvYWRQbHVnaW5EYXRhKCkge1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfREFUQSwgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlUGx1Z2luRGF0YSgpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdFZpZXcoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoUkVWSUVXX1FVRVVFX1ZJRVdfVFlQRSkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRSaWdodExlYWYoZmFsc2UpLnNldFZpZXdTdGF0ZSh7XHJcbiAgICAgICAgICAgIHR5cGU6IFJFVklFV19RVUVVRV9WSUVXX1RZUEUsXHJcbiAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYWRkQ29udGV4dFRvQ2FyZChcclxuICAgIGNhcmRPYmo6IENhcmQsXHJcbiAgICBjYXJkT2Zmc2V0OiBudW1iZXIsXHJcbiAgICBoZWFkaW5nczogSGVhZGluZ0NhY2hlW11cclxuKTogdm9pZCB7XHJcbiAgICBsZXQgc3RhY2s6IEhlYWRpbmdDYWNoZVtdID0gW107XHJcbiAgICBmb3IgKGxldCBoZWFkaW5nIG9mIGhlYWRpbmdzKSB7XHJcbiAgICAgICAgaWYgKGhlYWRpbmcucG9zaXRpb24uc3RhcnQub2Zmc2V0ID4gY2FyZE9mZnNldCkgYnJlYWs7XHJcblxyXG4gICAgICAgIHdoaWxlIChcclxuICAgICAgICAgICAgc3RhY2subGVuZ3RoID4gMCAmJlxyXG4gICAgICAgICAgICBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5sZXZlbCA+PSBoZWFkaW5nLmxldmVsXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcclxuXHJcbiAgICAgICAgc3RhY2sucHVzaChoZWFkaW5nKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBoZWFkaW5nT2JqIG9mIHN0YWNrKSBjYXJkT2JqLmNvbnRleHQgKz0gaGVhZGluZ09iai5oZWFkaW5nICsgXCIgPiBcIjtcclxuICAgIGNhcmRPYmouY29udGV4dCA9IGNhcmRPYmouY29udGV4dC5zbGljZSgwLCAtMyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluQ29kZWJsb2NrKFxyXG4gICAgbWF0Y2hTdGFydDogbnVtYmVyLFxyXG4gICAgbWF0Y2hMZW5ndGg6IG51bWJlcixcclxuICAgIGNvZGVibG9ja3M6IFtudW1iZXIsIG51bWJlcl1bXVxyXG4pIHtcclxuICAgIGZvciAobGV0IGNvZGVibG9jayBvZiBjb2RlYmxvY2tzKSB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICBtYXRjaFN0YXJ0ID49IGNvZGVibG9ja1swXSAmJlxyXG4gICAgICAgICAgICBtYXRjaFN0YXJ0ICsgbWF0Y2hMZW5ndGggPD0gY29kZWJsb2NrWzFdXHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4iXSwibmFtZXMiOlsiUGx1Z2luU2V0dGluZ1RhYiIsIlNldHRpbmciLCJOb3RpY2UiLCJNb2RhbCIsIlBsYXRmb3JtIiwiTWFya2Rvd25SZW5kZXJlciIsIkl0ZW1WaWV3IiwiTWVudSIsIlBsdWdpbiIsImFkZEljb24iLCJncmFwaC5yZXNldCIsImdyYXBoLmxpbmsiLCJnZXRBbGxUYWdzIiwiZ3JhcGgucmFuayJdLCJtYXBwaW5ncyI6Ijs7OztBQUVBLFNBQVMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7QUFDbEMsSUFBSSxJQUFJLENBQUMsT0FBTyxNQUFNLEtBQUssUUFBUSxNQUFNLE9BQU8sUUFBUSxLQUFLLFVBQVUsQ0FBQyxFQUFFO0FBQzFFLFFBQVEsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7QUFDaEMsWUFBWSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ3JELGdCQUFnQixJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFO0FBQzFELG9CQUFvQixNQUFNO0FBQzFCLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2IsU0FBUztBQUNULEtBQUs7QUFDTCxDQUFDO0FBQ0Q7QUFDQSxPQUFjLEdBQUcsQ0FB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
