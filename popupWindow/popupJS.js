document.addEventListener('DOMContentLoaded', () => {

    // ---- Shared markup builder (was duplicated between workTab / restTab) ----
    function pomodoroBlock({ showTimeLeftId, showOptions }) {
        return `
        <div class="row-container" id="displayCountdown">
            <div class="column-container">
                <div class="dove-text" style="align-self: flex-start;" id="${showTimeLeftId}">Time Left:</div>
                <div class="dove-countdown-before" id="countdownBefore">00:00</div>
                <div class="dove-countdown" id="countdownDuring">00:00</div>
                <div class="dove-countdown-after" id="countdownAfter">00:00</div>
                <div></div><div></div>
            </div>
            <div class="column-container">
                <div class="row-container">
                    <div class="dove-text" style="align-self: flex-start;" id="cyclesText">Cycles left:</div>
                    <div id="cyclesDisplay" class="dove-countdown">4</div>
                </div>
                <img src="/images/standingDoveWaving.gif" alt="Standing dove waving" width="200" height="133">
            </div>
        </div>
        ${showOptions ? `
        <div class="column-container" id="optionsCountdown">
            <div class="row-container">
                <h4 draggable="false" class="blocker-header">Cycles: </h4>
                <input type="number" id="cycles" min="1" value="4" draggable="false" style="display: inline-block;">
            </div>
            <div class="row-container">
                <h4 draggable="false" class="blocker-header">Work Interval (minutes): </h4>
                <input type="number" id="work" min="1" value="25" draggable="false" style="display: inline-block;">
            </div>
            <div class="row-container">
                <h4 draggable="false" class="blocker-header">Rest Interval (minutes): </h4>
                <input type="number" id="rest" min="1" value="5" draggable="false" style="display: inline-block;">
            </div>
            <button id="startBtn" class="edit-buttons">Start Timer</button>
        </div>` : ''}`;
    }

    function websiteBlockerBlock() {
        return `
        <h3 style="font-size:20px; border:5px solid #04668C; border-radius: 10px;">Website blocker</h3>
        <ul id="taskList">
            <div style="border: none;">
                <h4 draggable="false" class="blocker-header">Block the websites keyword</h4>
                <input type="text" id="url" placeholder="Enter word here..." draggable="false" style="display: inline-block;">
            </div>
        </ul>`;
    }

    const content = {
        goalsTab: `<h2>My Goals</h2>
                <ul id="taskList">
                    <div>
                        <h3 draggable="false" id="h3NotDone">Not Done</h3>
                        <input type="text" id="taskInputNotDone" placeholder="Add a new task..." draggable="false" style="display: inline-block;">
                    </div>
                    <div>
                        <h3 draggable="false" id="h3Doing">Doing</h3>
                        <input type="text" id="taskInputDoing" placeholder="Add a current task..." draggable="false" style="display: inline-block;">
                    </div>
                    <div>
                        <h3 draggable="false" id="h3Done">Done</h3>
                        <input type="text" id="taskInputDone" placeholder="Add an old task..." draggable="false" style="display: inline-block;">
                    </div>
                </ul>`,
        workTab: `<h2>Work</h2>
                <div class="column-container">
                <h3 style="font-size:20px; border:5px solid #04668C; border-radius: 10px; width: 100%;">Pomodoro</h3>
                    ${pomodoroBlock({ showTimeLeftId: 'timeLeftText', showOptions: true })}
                </div>
                ${websiteBlockerBlock()}`,
        restTab: `<h2>Rest</h2>
        <div class="column-container">
        <h3 style="font-size:20px; border:5px solid #04668C; border-radius: 10px; width: 100%;">Pomodoro</h3>
            ${pomodoroBlock({ showTimeLeftId: 'timeLeftText', showOptions: false })}
        </div>
        ${websiteBlockerBlock()}`,
        settingsTab: `<h2>Settings</h2>
                    <h3 style="font-size:20px; border:5px solid #04668C; border-radius: 10px;">Strict Mode</h3>
                    <div class="column-container">
                        <div class="row-container">
                            <h4>Can unblock sites</h4>
                            <label class="switch">
                                <input type="checkbox" id="unblockOnOff" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="row-container">
                            <h4>Can skip rest/work cycles</h4>
                            <label class="switch">
                                <input type="checkbox" id="endCycleOnOff" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="row-container">
                            <h4>Can end pomodoro anytime</h4>
                            <label class="switch">
                                <input type="checkbox" id="endPomodoroOnOff" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
            `
    };

    const loadContent = {
        goalsTab: loadTasks,
        workTab: loadWorkTab,
        restTab: loadRestTab,
        settingsTab: loadSettings
    };

    function wrongContentBlock({ heading, statusText, buttonId, buttonLabel, verb }) {
        return `<div class="bg-container other">
        <h2>${heading}</h2>
        <div class="row-container">
            <div class="dove-text" style="border-top-right-radius: 0px; margin-right: 10px;">${statusText}</div>
            <img src="/images/standingBird.png" alt="Standing dove" width="200" height="185">
        </div>
        <button id="${buttonId}" class="edit-buttons" style="width: 200px;">${buttonLabel}</button>
        <button id="endPomodoro" class="edit-buttons" style="width: 250px;">End pomodoro and ${verb}</button>
        </div>
        `;
    }

    const wrongContent = {
        workTab: wrongContentBlock({
            heading: 'Work', statusText: "You're in rest mode!",
            buttonId: 'endCycletoWork', buttonLabel: 'Skip rest cycle', verb: 'work'
        }),
        restTab: wrongContentBlock({
            heading: 'Rest', statusText: "You're in work mode!",
            buttonId: 'endCycletoRest', buttonLabel: 'Skip work cycle', verb: 'rest'
        }),
    };

    const loadWrongContent = {
        workTab: loadChangedWorkTab,
        restTab: loadChangedRestTab,
    };

    document.querySelector('.boxes').addEventListener('click', (event) => {
        const button = event.target.closest('.unselected-box');
        if (!button) return;

        const targetPage = button.getAttribute('data-target');
        if (targetPage === 'workTab' || targetPage === 'restTab') {
            chrome.storage.sync.get('mode', (data) => {
                const mode = data.mode;
                const isMismatched =
                    (mode === 'Rest' && targetPage === 'workTab') ||
                    (mode === 'Work' && targetPage === 'restTab');
                if (isMismatched) {
                    changeMainContent(targetPage, wrongContent, loadWrongContent, button);
                } else {
                    changeMainContent(targetPage, content, loadContent, button);
                }
            });
        } else {
            changeMainContent(targetPage, content, loadContent, button);
        }
    });

    document.querySelector('.settings-cog').addEventListener('click', (event) => {
        const targetPage = event.target.getAttribute('data-target');
        changeMainContent(targetPage, content, loadContent, null);
    });

    chrome.storage.onChanged.addListener((changes) => {
        if (!changes.mode) return;
        if (changes.mode.newValue === 'Rest') {
            changeMainContent('restTab', content, loadContent, document.getElementById('restIcon'));
        } else if (changes.mode.newValue === 'Work') {
            changeMainContent('workTab', content, loadContent, document.getElementById('workIcon'));
        }
    });

    // load the default tab on page load
    document.getElementById('content').innerHTML = content['goalsTab'];
    loadTasks();
});

function changeMainContent(targetPage, content, loadContent, button) {
    document.getElementById('content').innerHTML = content[targetPage];
    loadContent[targetPage]();
    document.querySelectorAll('.boxes button').forEach(btn => {
        btn.classList.remove('selected-box');
        btn.classList.add('unselected-box');
    });
    if (button) {
        button.classList.remove('unselected-box');
        button.classList.add('selected-box');
    }
}

// ---------------- GOALS TAB ----------------
function loadTasks() {
    ['NotDone', 'Doing', 'Done'].forEach(section => {
        document.getElementById(`taskInput${section}`).addEventListener('keydown', (event) => {
            if (event.key === 'Enter') addTask(section);
        });
    });

    const tasks = getTasksFromStorage();
    Object.keys(tasks).forEach(section => {
        tasks[section].forEach(task => addTaskToDOM(section, task));
    });
    makeTaskDraggable(document.querySelector('#taskList'));
}

function addTask(section) {
    const taskInput = document.getElementById(`taskInput${section}`);
    const taskList = getTasksFromStorage();

    if (!taskList[section]) taskList[section] = [];

    const value = taskInput.value.trim();
    if (value === '') return;

    const task = { id: `task${taskList[section].length}`, content: value };
    taskList[section].push(task);
    saveTasksToStorage(taskList);

    addTaskToDOM(section, task);
    taskInput.value = '';
}

function addTaskToDOM(section, task) {
    const taskList = document.querySelector(`#taskList #h3${section}`).parentNode;
    const listItem = document.createElement('li');
    listItem.draggable = true;

    const taskSpan = document.createElement('span');
    taskSpan.id = task.id;
    taskSpan.textContent = task.content;
    taskSpan.contentEditable = true;
    taskSpan.style.cursor = "text";
    taskSpan.addEventListener('dragstart', (e) => e.preventDefault()); // keep text non-draggable
    taskSpan.addEventListener('click', () => editTask(section, taskSpan));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.onclick = () => {
        deleteTask(section, task.id);
        listItem.parentNode.removeChild(listItem);
    };

    const prettyBulletPoint = document.createElement('div');
    prettyBulletPoint.className = 'bullet-point';

    listItem.appendChild(prettyBulletPoint);
    listItem.appendChild(taskSpan);
    listItem.appendChild(deleteButton);
    taskList.parentNode.insertBefore(listItem, taskList.nextSibling);
}

function editTask(section, taskSpan) {
    const taskList = getTasksFromStorage();
    const task = taskList[section].find(t => t.id === taskSpan.id);
    if (!task) return;

    taskSpan.focus();
    // Use onblur (overwrite) instead of addEventListener so re-editing the same
    // span never stacks up duplicate blur handlers.
    taskSpan.onblur = () => {
        if (taskSpan.textContent === "") {
            deleteTask(section, taskSpan.id);
        } else {
            task.content = taskSpan.textContent;
            const freshList = getTasksFromStorage();
            freshList[section] = freshList[section].map(t => (t.id === task.id ? task : t));
            saveTasksToStorage(freshList);
        }
    };
}

function deleteTask(section, taskId) {
    const taskList = getTasksFromStorage();
    taskList[section] = taskList[section].filter(task => task.id !== taskId);
    saveTasksToStorage(taskList);
}

function getTasksFromStorage() {
    const tasks = localStorage.getItem('tasks');
    if (!tasks || tasks === 'undefined') {
        return {
            'NotDone': [{ id: "task0", content: "Your first task! Drag/drop, edit, or delete this." }],
            'Doing': [],
            'Done': []
        };
    }
    return JSON.parse(tasks);
}

function saveTasksToStorage(taskList) {
    localStorage.setItem('tasks', JSON.stringify(taskList));
}

/**
 * Inspiration from geeksforgeeks.org
 * @param {*} sortableList list to have draggable items
 */
function makeTaskDraggable(sortableList) {
    let draggedItem = null;
    const allDraggableElements = [...sortableList.querySelectorAll("ul div")];

    sortableList.addEventListener("dragstart", (e) => {
        allDraggableElements.forEach((el) => el.style.border = '5px solid #04668C');
        draggedItem = e.target;
        setTimeout(() => { e.target.style.display = "none"; }, 0);
    });

    sortableList.addEventListener("dragend", (e) => {
        allDraggableElements.forEach((el) => el.style.border = '5px solid #04668C');
        setTimeout(() => {
            e.target.style.display = "";
            draggedItem = null;
            saveTasksOrder();
        }, 0);
    });

    sortableList.addEventListener("dragover", (e) => {
        e.preventDefault();
        allDraggableElements.forEach((el) => el.style.border = '5px solid #04668C');

        let afterElement = getDragAfterElement(sortableList, e.clientY);
        if (!afterElement) return;

        if (afterElement.tagName === 'LI') {
            let sibling = afterElement.previousElementSibling;
            while (sibling && sibling.tagName !== 'DIV') {
                sibling = sibling.previousElementSibling;
            }
            afterElement = sibling;
        }
        if (!afterElement) return;

        afterElement.style.border = '5px dashed #04668C';
        try {
            sortableList.insertBefore(draggedItem, afterElement.nextSibling);
        } catch (error) {
            // still works — throws only while the DOM is in a transient state during hover
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [
            ...container.querySelectorAll("li:not(.dragging)"),
            ...container.querySelectorAll("div:not(.dragging)"),
        ];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveTasksOrder() {
        const sections = ['NotDone', 'Doing', 'Done'];
        const taskList = {};
        sections.forEach(section => {
            taskList[section] = [];
            const sectionElement = document.querySelector(`h3#h3${section}`).parentNode;
            let item = sectionElement.nextElementSibling; // was missing `let` — leaked to window
            while (item && item.tagName === 'LI') {
                const id = item.querySelector('span').id;
                const content = item.querySelector('span').textContent;
                taskList[section].push({ id, content });
                item = item.nextElementSibling;
            }
            taskList[section] = taskList[section].reverse();
        });
        saveTasksToStorage(taskList);
    }
}

// ---------------- WORK / REST TABS ----------------
function doBlockWebsiteButtons(mode) {
    const setBlockedWebsites = "blockedSites" + mode;
    chrome.storage.sync.get([setBlockedWebsites], function (result) {
        let blockedSites = result[setBlockedWebsites] || [];
        blockedSites.forEach((site, i) => addWebsiteToDOM(site, i, setBlockedWebsites));

        const urlInput = document.getElementById('url');
        if (!urlInput) return;

        urlInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            const urlInputValue = urlInput.value.trim();
            if (urlInputValue === '') return;

            if (urlInputValue.includes(" ")) {
                urlInput.placeholder = 'Only one word...';
            } else if (blockedSites.includes(urlInputValue)) {
                urlInput.placeholder = 'A unique word...';
            } else {
                blockedSites.push(urlInputValue);
                chrome.storage.sync.set({ [setBlockedWebsites]: blockedSites }, () => {
                    addWebsiteToDOM(urlInputValue, blockedSites.length, setBlockedWebsites);
                });
            }
            urlInput.value = '';
        });
    });

    function addWebsiteToDOM(site, index, setBlockedWebsites) {
        const taskList = document.querySelector('#taskList');
        if (!taskList) return;

        const listItem = document.createElement('li');
        listItem.classList = 'notDrag';
        const taskSpan = document.createElement('span');
        taskSpan.textContent = site;

        chrome.storage.local.get('showDeleteBin', (result) => {
            if (result.showDeleteBin) {
                const removeSite = document.createElement('button');
                removeSite.className = 'delete-button';
                removeSite.onclick = () => {
                    chrome.storage.sync.get([setBlockedWebsites], function (result) {
                        let blockedSites = result[setBlockedWebsites];
                        if (!blockedSites) return;
                        if (blockedSites.length === 1) index = 0;
                        blockedSites.splice(index, 1);
                        chrome.storage.sync.set({ [setBlockedWebsites]: blockedSites }, () => {
                            taskList.removeChild(listItem);
                        });
                    });
                };
                listItem.appendChild(removeSite);
            } else {
                listItem.style.paddingTop = '10px';
                listItem.style.paddingBottom = '10px';
            }
        });

        listItem.appendChild(taskSpan);
        taskList.appendChild(listItem);
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Single, module-level message listener shared by both work/rest tabs, instead
// of re-registering a new chrome.runtime.onMessage listener every time
// doCountdownTimer() runs (previously: one extra listener per tab switch,
// causing duplicate DOM writes over time).
let countdownTimerRefs = null; // set by doCountdownTimer(); null when not on a countdown tab

chrome.runtime.onMessage.addListener((request) => {
    if (request.action !== "updateTimerState" || !countdownTimerRefs) return;

    const { countdownBefore, countdownDuring, countdownAfter, cyclesDisplay,
        displayCountdown, optionsCountdown, countdownExtras, isWork } = countdownTimerRefs;
    const remainingTime = request.remainingTime;

    countdownBefore.textContent = formatTime(remainingTime - 1);
    countdownDuring.textContent = formatTime(remainingTime);
    countdownAfter.textContent = formatTime(remainingTime + 1);
    cyclesDisplay.textContent = `${request.totalCycles - request.currentCycle}`;
    displayCountdown.style.display = "flex";

    if (isWork) {
        if (optionsCountdown) optionsCountdown.style.display = "none";
    } else {
        countdownExtras.forEach(el => { if (el) el.style.display = "block"; });
        const smlBranchImg = document.getElementById('smallBranchURL');
        if (smlBranchImg) smlBranchImg.remove();
        displayCountdown.style.justifyContent = "space-between";
    }
});

function doCountdownTimer(isWork) {
    const countdownBefore = document.getElementById('countdownBefore');
    const countdownDuring = document.getElementById('countdownDuring');
    const countdownAfter = document.getElementById('countdownAfter');
    const cyclesDisplay = document.getElementById('cyclesDisplay');
    const cyclesText = document.getElementById('cyclesText');
    const timeLeftText = document.getElementById('timeLeftText');
    const displayCountdown = document.getElementById('displayCountdown');
    const optionsCountdown = isWork ? document.getElementById('optionsCountdown') : null;

    // Registers/updates the shared listener's target elements for the tab
    // currently on screen. Cleared when leaving this view (see loadSettings/
    // loadChangedWorkTab/loadChangedRestTab, which set it back to null).
    countdownTimerRefs = {
        countdownBefore, countdownDuring, countdownAfter, cyclesDisplay,
        displayCountdown, optionsCountdown, isWork,
        countdownExtras: [countdownAfter, countdownBefore, countdownDuring, timeLeftText]
    };

    chrome.storage.sync.get('timer', (data) => {
        const isTimerOn = data.timer;

        if (isWork) {
            displayCountdown.style.display = isTimerOn ? "flex" : "none";
            optionsCountdown.style.display = isTimerOn ? "none" : "flex";

            document.getElementById('startBtn').addEventListener('click', () => {
                const cycles = document.getElementById('cycles').value;
                const workDuration = document.getElementById('work').value;
                const restDuration = document.getElementById('rest').value;
                chrome.runtime.sendMessage({
                    cmd: "START_TIMER",
                    cycles: parseInt(cycles),
                    workDuration: parseInt(workDuration),
                    restDuration: parseInt(restDuration)
                }, (response) => {
                    chrome.storage.sync.set({ mode: 'Work' }, () => {
                        const message = `${response.status} You will be working for ${workDuration} minutes, and will be blocked out of all specified URLs.`;
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: '/icons/doveLogo128.png',
                            title: 'Dove Reminder - Work',
                            message: message,
                            priority: 2
                        });
                    });
                });
            });
        } else if (!isTimerOn) {
            cyclesText.innerHTML = "Go into the work tab to start a pomodoro session...";
            cyclesDisplay.style.display = "none";
            countdownAfter.style.display = "none";
            countdownBefore.style.display = "none";
            countdownDuring.style.display = "none";
            timeLeftText.style.display = "none";

            const smlBranchImg = document.createElement('img');
            smlBranchImg.src = chrome.runtime.getURL('/images/smallBranch.png');
            smlBranchImg.id = "smallBranchURL";
            smlBranchImg.style.transform = "rotate(90deg)";
            smlBranchImg.style.left = "7%";
            smlBranchImg.style.position = "relative";
            smlBranchImg.style.width = "55vw";
            displayCountdown.style.justifyContent = "end";
            displayCountdown.insertBefore(smlBranchImg, displayCountdown.firstChild);
        }
    });
}

function doChangedTab(isWork) {
    const modeString = isWork ? "Work" : "Rest";
    const endPomodoroButton = document.getElementById('endPomodoro');
    const endCycle = document.getElementById(`endCycleto${modeString}`);

    // Combined into a single storage.local.get instead of one per toggle.
    chrome.storage.local.get(['showEndPomodoro', 'showEndCycle'], (result) => {
        const showEndCycle = result.showEndCycle ?? true;
        const showEndPomodoro = result.showEndPomodoro ?? true;

        if (!showEndCycle && !showEndPomodoro) {
            endPomodoroButton.style.display = "none";
            endCycle.style.display = "none";
            return;
        }

        chrome.storage.sync.get('timer', (data) => {
            const isTimerOn = data.timer;

            if (!isTimerOn) {
                endCycle.style.display = "none";
                endPomodoroButton.style.display = showEndPomodoro ? "block" : "none";
                if (showEndPomodoro) {
                    endPomodoroButton.innerHTML = `Switch to ${modeString.toLowerCase()} mode`;
                    endPomodoroButton.onclick = () => {
                        chrome.storage.sync.set({ mode: modeString });
                    };
                }
                return;
            }

            endCycle.style.display = showEndCycle ? "block" : "none";
            if (showEndCycle) {
                endCycle.onclick = () => {
                    chrome.runtime.sendMessage({ cmd: 'SKIP_CYCLE' });
                };
            }

            endPomodoroButton.style.display = showEndPomodoro ? "block" : "none";
            if (showEndPomodoro) {
                endPomodoroButton.onclick = () => {
                    chrome.runtime.sendMessage({ cmd: 'STOP_TIMER' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error in Dove extension:', chrome.runtime.lastError);
                        } else if (response && response.status === 'success') {
                            chrome.storage.sync.set({ mode: modeString });
                        }
                    });
                };
            }
        });
    });
}

// WORK TAB
function loadWorkTab() {
    doCountdownTimer(true);
    doBlockWebsiteButtons("Work");
}

function loadChangedWorkTab() {
    countdownTimerRefs = null; // leaving the countdown view
    doChangedTab(true);
}

// REST TAB
function loadRestTab() {
    doCountdownTimer(false);
    doBlockWebsiteButtons("Rest");
}

function loadChangedRestTab() {
    countdownTimerRefs = null; // leaving the countdown view
    doChangedTab(false);
}

// ---------------- SETTINGS ----------------
function loadSettings() {
    countdownTimerRefs = null; // leaving the countdown view
    function onOrOffButton(storageVar, elementId) {
        const toggleInteractionElem = document.getElementById(elementId);
        chrome.storage.local.get(storageVar, (result) => {
            const stored = result[storageVar];
            toggleInteractionElem.checked = stored === undefined ? true : stored;
        });
        toggleInteractionElem.onclick = () => {
            chrome.storage.local.set({ [storageVar]: toggleInteractionElem.checked });
        };
    }

    onOrOffButton('showEndPomodoro', 'endPomodoroOnOff');
    onOrOffButton('showEndCycle', 'endCycleOnOff');
    onOrOffButton('showDeleteBin', 'unblockOnOff');
}