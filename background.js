// for URL blocking
function updateBlockedSites() {
    chrome.storage.sync.get(['mode', 'blockedSitesRest', 'blockedSitesWork'], function (result) {
        let blockedSites = [];

        // Select the appropriate blocked sites list based on the mode
        if (result.mode === 'Rest') {
            blockedSites = result.blockedSitesRest || [];
        } else if (result.mode === 'Work') {
            blockedSites = result.blockedSitesWork || [];
        }

        // Get the existing dynamic rules and clear them
        chrome.declarativeNetRequest.getDynamicRules(function (existingRules) {
            const oldRuleIds = existingRules.map(rule => rule.id);

            // Create new rules for the currently blocked sites
            const newRules = blockedSites.map((site, index) => ({
                id: index + 1,
                priority: 1,
                action: { type: 'block' },
                condition: { urlFilter: `*${site}*`, resourceTypes: ["main_frame"] }
            }));

            // Remove old rules and add new rules based on the current mode
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: oldRuleIds,
                addRules: newRules
            }, function () {
                if (chrome.runtime.lastError) {
                    console.error("Error updating dynamic rules:", chrome.runtime.lastError);
                }
            });
        });
    });
}

// listens and executes all action messages
let currentCycle = 0;
let totalCycles = 0;
let workDuration = 0; // mins
let restDuration = 0; // mins
let remainingTime = 0; // in seconds
let isWorking = true;
let sendTimerSecs;

// Save current state to session storage so it survives service worker restarts
function saveState() {
    chrome.storage.session.set({
        currentCycle,
        totalCycles,
        workDuration,
        restDuration,
        remainingTime,
        isWorking
    });
}

// Load state back into memory. Returns a Promise so callers can await it.
function loadState() {
    return new Promise((resolve) => {
        chrome.storage.session.get(
            ['currentCycle', 'totalCycles', 'workDuration', 'restDuration', 'remainingTime', 'isWorking'],
            (result) => {
                currentCycle = result.currentCycle ?? 0;
                totalCycles = result.totalCycles ?? 0;
                workDuration = result.workDuration ?? 0;
                restDuration = result.restDuration ?? 0;
                remainingTime = result.remainingTime ?? 0;
                isWorking = result.isWorking ?? true;
                resolve();
            }
        );
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        await loadState(); // rehydrate before acting, in case the worker just woke up

        if (request.cmd === 'START_TIMER') {
            totalCycles = request.cycles;
            workDuration = request.workDuration;
            restDuration = request.restDuration;
            currentCycle = 0;
            remainingTime = workDuration * 60; // Start with work time
            updateIcon("work");

            chrome.alarms.clearAll();
            chrome.alarms.create("work", { delayInMinutes: workDuration });
            chrome.alarms.create("updateIcon", { delayInMinutes: 1, periodInMinutes: 1 });

            isWorking = true;
            const mode = isWorking ? 'Work' : 'Rest';
            chrome.storage.sync.set({ mode: mode });
            chrome.storage.sync.set({ timer: true });
            saveState();
            sendResponse({ status: isWorking ? "Started work mode!" : "Started rest mode!" });
        } else if (request.cmd === 'STOP_TIMER') {
            resetTimer();
            sendResponse({ status: 'success' });
        } else if (request.cmd === 'SKIP_CYCLE') {
            skipCycle();
        }
    })();

    return true; // async response path is always possible now, so always keep the channel open
});

// Helper function to send the current timer state to the popup
function sendTimerState() {
    chrome.runtime.sendMessage({
        action: "updateTimerState",
        remainingTime,
        totalCycles,
        currentCycle,
        isWorking
    });
}

function updateModeSendNotif(isPomodoro) {
    const mode = isWorking ? 'Work' : 'Rest';
    chrome.storage.sync.set({ mode: mode });
    const message = isPomodoro ? `Time is up... get ready to ${mode.toLowerCase()}!`
        : "You've finished your current pomodoro! Rest mode will be on until your next work session.";
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/doveLogo128.png',
        title: `Switched to ${mode.toLowerCase()} interval`,
        message: message,
        priority: 2
    });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    await loadState(); // rehydrate in case the worker restarted between alarms

    if (alarm.name === "work") {
        currentCycle++;
        remainingTime = restDuration * 60;
        updateIcon("rest");
        chrome.alarms.create("rest", { delayInMinutes: restDuration });
        isWorking = false;
        saveState();
        sendTimerState();
        updateModeSendNotif(true);
    } else if (alarm.name === "rest") {
        if (currentCycle < totalCycles) {
            remainingTime = workDuration * 60;
            updateIcon("work");
            chrome.alarms.create("work", { delayInMinutes: workDuration });
            isWorking = true;
            saveState();
            updateModeSendNotif(true);
        } else {
            resetTimer();
            updateModeSendNotif(false);
        }
        sendTimerState();
    } else if (alarm.name === "updateIcon") {
        updateIcon(isWorking ? "work" : "rest");
    }
});

function updateIcon(type) {
    const minutesLeft = Math.ceil(remainingTime / 60);
    chrome.action.setBadgeText({ text: String(minutesLeft) + "m" });
    chrome.action.setBadgeBackgroundColor({ color: type === "work" ? "#F2A007" : "#0388A6" });

    if (remainingTime > 0) {
        if (sendTimerSecs) clearInterval(sendTimerSecs);
        sendTimerSecs = setInterval(() => {
            remainingTime--;
            saveState(); // keep session storage in sync every tick, so a restart mid-countdown resumes close to correct
            sendTimerState();
        }, 1000);
    }
}

function resetTimer() {
    currentCycle = 0;
    remainingTime = 0;
    chrome.action.setBadgeText({ text: "" });
    chrome.alarms.clearAll();
    if (sendTimerSecs) clearInterval(sendTimerSecs);
    chrome.storage.sync.set({ timer: false });
    chrome.storage.session.remove([
        'currentCycle', 'totalCycles', 'workDuration',
        'restDuration', 'remainingTime', 'isWorking'
    ]);
}

function skipCycle() {
    if (isWorking) {
        // Skip the current work session, switch to rest
        remainingTime = restDuration * 60;
        updateIcon("rest");
        chrome.alarms.clear("work");
        chrome.alarms.create("rest", { delayInMinutes: restDuration });
        isWorking = false;
    } else {
        remainingTime = workDuration * 60;
        updateIcon("work");
        chrome.alarms.clear("rest");
        chrome.alarms.create("work", { delayInMinutes: workDuration });
        isWorking = true;
        currentCycle++;
    }
    saveState();
    sendTimerState();
    updateModeSendNotif(true);
}

// LISTENERS
chrome.storage.onChanged.addListener(async (changes) => {
    if (changes.blockedSitesRest || changes.blockedSitesWork || changes.mode) {
        updateBlockedSites();
    }
});