// throttling global variables
let replaceWait = false;
let replaceWaitTime = 250; // quarter of a second
let replaceQueue = [];

// language configuration
let useLang = 'en';
let supportedLangs = ['en'];
let htmlLang = document.documentElement.lang ? document.documentElement.lang.slice(0,2).toLowerCase() : 'en'; // english if not declared
let firstLang = '';

const re = (input) => {
    let firstLetter = input[0];
    let rest = input.slice(1);
    return new RegExp(`\\b(${firstLetter})(${rest})\\b`, 'gi');
};

const casing = (input) => {
    let firstLetter = input[0];
    let firstLetterUpper = firstLetter.toUpperCase(); // we use ASCII because all first letters are ASCII.
    let rest = input.slice(1);
    return [`${firstLetter}${rest}`, `${firstLetterUpper}${rest}`];
};

const data = {
    'en': {
        'singular': {
            'terms': [
                re('2020'),
            ],
            'replacement': casing('(the year we would rather forget)'),
        },
        'plural': {
            'terms': [
                re('2020')
            ],
            'replacement': casing('(the year we would rather forget)'),
        },
    },
};

const data_multi = {
    'singular': {
        'terms': [
            re('2020'),
        ],
        'replacement': data[useLang].singular.replacement,
    },
    'plural': {
        'terms': [
            re('2020'),
        ],
        'replacement': data[useLang].plural.replacement,
    },
};

function replaceText(v) {

    for (let lang in data) {
        for (let category in data[lang]) {
            let [replacement, replacementUpper] = data[lang][category].replacement;
            for (let term of data[lang][category].terms) {
                v = v.replace(term, (match, firstLetter) => firstLetter == firstLetter.toUpperCase() ? replacementUpper : replacement);
            }
        }
    }

    for (let category in data_multi) {
        for (let term of data_multi[category].terms) {
            let [replacement, replacementUpper] = data_multi[category].replacement;

            v = v.replace(term, (match, firstLetter) => firstLetter == firstLetter.toUpperCase() ? replacementUpper : replacement);
        }
    }

    return v;
}

function processQueue() {
    // clone queue
    let queue = replaceQueue.slice(0);
    // empty queue
    replaceQueue = [];
    // loop through clone
    queue.forEach( (mutations) => {
        replaceNodes(mutations);
    });
}

function setWait() {
    replaceWait = true;
    setTimeout(function () {
        replaceWait = false;
        timerCallback();
    }, replaceWaitTime);
}

function timerCallback() {
    if(replaceQueue.length > 0) {
        // if there are queued items, process them
        processQueue();
        // then set wait to do next batch
        setWait();
    } else {
        // if the queue has been empty for a full timer cycle
        // remove the wait time to process the next action
        replaceWait = false;
    }
}

// The callback used for the document body and title observers
function observerCallback(mutations) {
    // add to queue
    replaceQueue.push(mutations);
    if(!replaceWait) {
        processQueue();
        setWait();
    } // else the queue will be processed when the timer finishes
}

function walk(rootNode) {
    // Find all the text nodes in rootNode
    let walker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                return /^(STYLE|SCRIPT)$/.test(node.parentElement.tagName) || /^\s*$/.test(node.data) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    ),
    node;

    // Modify each text node's value
    while (node = walker.nextNode()) {
        handleText(node);
    }
}

function handleText(textNode) {
    textNode.nodeValue = replaceText(textNode.nodeValue);
}

// Returns true if a node should *not* be altered in any way
const forbiddenTagNames = ['textarea', 'input', 'script', 'noscript', 'template', 'style'];
function isForbiddenNode(node) {
    if (node.isContentEditable) {
        return true;
    } else if (node.parentNode && node.parentNode.isContentEditable) {
        return true;
    } else {
        return forbiddenTagNames.includes(node.tagName.toLowerCase());
    }
}

// The callback used for the document body and head observers
function replaceNodes(mutations) {
    let i, node;

    mutations.forEach(function(mutation) {
        for (i = 0; i < mutation.addedNodes.length; i++) {
            node = mutation.addedNodes[i];
            if (isForbiddenNode(node)) {
                // Should never operate on user-editable content
                continue;
            } else if (node.nodeType === 3) {
                // Replace the text for text nodes
                handleText(node);
            } else {
                // Otherwise, find text nodes within the given node and replace text
                walk(node);
            }
        }
    });
}

// Walk the doc (document) body, replace the title, and observe the body and head
function walkAndObserve(doc) {
    let docHead = doc.getElementsByTagName('head')[0],
    observerConfig = {
        characterData: true,
        childList: true,
        subtree: true
    },
    bodyObserver, headObserver;

    // Do the initial text replacements in the document body and title
    walk(doc.body);
    doc.title = replaceText(doc.title);

    // Observe the body so that we replace text in any added/modified nodes
    bodyObserver = new MutationObserver(observerCallback);
    bodyObserver.observe(doc.body, observerConfig);

    // Observe the title so we can handle any modifications there
    if (docHead) {
        headObserver = new MutationObserver(observerCallback);
        headObserver.observe(docHead, observerConfig);
    }
}

// Runtime
// only if the lanuage is supported
if (supportedLangs.includes(htmlLang) === true) {
    browser.i18n.getAcceptLanguages().then((languages) => {
        let firstLang = languages.length > 0 ? languages[0] : '';

        if (htmlLang.startsWith('en')) {
            useLang = 'en';
        } else if (htmlLang.startsWith('en')) {
            useLang = 'en';
        } else if (htmlLang.startsWith('en')) {
            useLang = 'en';
        } else if (firstLang.startsWith('en')) {
            useLang = 'en';
        } else if (firstLang.startsWith('en')) {
            useLang = 'en';
        }

        walkAndObserve(document);
    });
}
