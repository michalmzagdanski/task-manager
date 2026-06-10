let tasks = [];

let editingTaskId = null;
let selectedTaskId = null;

let currentFilter = "all";
let currentSort = "priority";

let isLoadingTasks = false;
let hasLoadingError = false;
const priorityOrder = {
    high: 1,
    medium: 2,
    low: 3

};
const notesInput = document.getElementById("notesInput");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const searchInput = document.getElementById("searchInput");
const taskList = document.getElementById("taskList");
const counter = document.getElementById("counter");
const sortSelect = document.getElementById("sortSelect");

const editNotesInput = document.getElementById("editNotesInput");
const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const editPriorityInput = document.getElementById("editPriorityInput");
const editDueDateInput = document.getElementById("editDueDateInput");
const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

async function startApp() {
    loadCurrentFilter()
    await loadTasks();
}

startApp();
function setFilter(filter) {
    currentFilter = filter;
    saveCurrentFilter()
    renderTasks();
}
function loadCurrentFilter() {
    const saved = localStorage.getItem("currentFilter");
    if (saved !== null) {
        currentFilter = saved;
    }
}
function saveCurrentFilter() {
    localStorage.setItem("currentFilter", currentFilter);
}
function getPriorityIcon(priority) {
    if (priority === "high") {
        return "🔴";
    }
    else if (priority === "medium") {
        return "🟡";
    }
    else if (priority === "low") {
        return "🟢";
    }
}
function isOverdue(task) {
    const today = getToday();
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return task.dueDate && !task.done && taskDate < today;
}
function isDueToday(task) {
    const today = getToday();
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return task.dueDate && !task.done && taskDate.getTime() === today.getTime();
}

function updateCounter(count) {
    counter.textContent =
        "Visible tasks: " + count;
}
function checkEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }

}
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    updateApp()
}
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    task.done = !task.done;

    updateApp()
}
function selectTask(id) {
    selectedTaskId = id;
    renderTasks();
}
function saveTasks() {

    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }
    catch {
        alert("Memory is full!");
    }
}
async function loadTasks() {
    isLoadingTasks = true;
    renderTasks();

    try {
        await new Promise(function (resolve) {
            setTimeout(resolve, 2000);
        });

        // throw new Error("Loading failed");

        let savedTasks = localStorage.getItem("tasks");

        if (savedTasks !== null) {
            tasks = JSON.parse(savedTasks);
        }

        isLoadingTasks = false;

        renderTasks();
    }
    catch {
        isLoadingTasks = false;
        hasLoadingError = true;
        renderTasks();
    }

}

function updateApp() {
    saveTasks();
    renderTasks();
}
function getToday() {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}
function clearCompleted() {
    tasks = tasks.filter(task => !task.done);
    updateApp();
}
function setSort(sort) {
    currentSort = sort;

    renderTasks();
}

function getTasksToShow() {
    let tasksToShow = [...tasks];
    if (currentFilter === "highPriority") {
        tasksToShow = tasks.filter(task => !task.done && task.priority === "high");


    }

    if (currentFilter === "active") {
        tasksToShow = tasks.filter(task => !task.done);
    }


    if (currentFilter === "done") {
        tasksToShow = tasks.filter(task => task.done);
    }
    let today = getToday();

    if (currentFilter === "overdue") {
        tasksToShow = tasks.filter(isOverdue);

        tasksToShow.sort(function (a, b) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }
    if (currentFilter === "dueToday") {
        tasksToShow = tasks.filter(isDueToday);


        tasksToShow.sort(function (a, b) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    let searchText = searchInput.value.toLowerCase();

    tasksToShow = tasksToShow.filter(task =>
        task.text.toLowerCase().includes(searchText)
    );

    if (currentFilter === "all") {
        tasksToShow.sort(function (a, b) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    if (currentSort === "newest") {
        tasksToShow.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    if (currentSort === "oldest") {
        tasksToShow.sort(function (a, b) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    return tasksToShow;
}


function renderTasks() {
    if (isLoadingTasks) {
        taskList.innerHTML = "<li>Loading tasks...</li>";
        return;
    }
    if (hasLoadingError) {
        taskList.innerHTML = `
                    <li>Failed to load tasks
                   <button id="retryBtn">Please try again</button>
                   </li>`;

        const retryBtn = document.getElementById("retryBtn");

        retryBtn.onclick = function () {
            loadTasks();
        };

        return;
    }
    taskList.innerHTML = "";
    const tasksToShow = getTasksToShow();
    if (tasksToShow.length === 0) {
        updateCounter(0);

        selectedTaskId = null;
        taskList.innerHTML = "<li>No tasks</li>";

        return;
    }
    const isSelectedTaskVisible = tasksToShow.some(
        task => task.id === selectedTaskId
    );

    if (!isSelectedTaskVisible) {
        selectedTaskId = null;
    }




    updateCounter(tasksToShow.length);

    for (let task of tasksToShow) {

        let li = createTaskElement(task);

        taskList.appendChild(li);
    }

}
function getTaskDetailsHtml(task) {
    const createdDate = new Date(task.createdAt);
    const updatedDate = new Date(task.updatedAt);

    return `
        <h2>${task.text}</h2>
        <p>Priority: ${task.priority}</p>
        <p>Notes: ${task.notes || "No notes"}</p>
        <p>Created: ${createdDate.toLocaleDateString()}</p>
        <p>Updated: ${updatedDate.toLocaleDateString()}</p>
    `;
}
function openEditModal(id) {
    editingTaskId = id;

    const task = tasks.find(task => task.id === editingTaskId);
    if (!task) {
        return;
    }
    const input = editInput;
    const priorityInput = editPriorityInput;
    const dueDateInput = editDueDateInput;

    input.value = task.text;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate;
    editNotesInput.value = task.notes || "";
    const modal = editModal;
    modal.classList.remove("hidden");
    input.focus();

}

function saveEditedTask() {
    const input = editInput;
    const priorityInput = editPriorityInput;
    const dueDateInput = editDueDateInput;
    const task = tasks.find(task => task.id === editingTaskId);
    if (!task) {
        return;
    }
    task.text = input.value.trim();
    task.priority = priorityInput.value;
    task.dueDate = dueDateInput.value;
    task.notes = editNotesInput.value.trim();
    task.updatedAt = new Date().toISOString();

    updateApp();
    closeEditModal();
}
function closeEditModal() {
    const modal = editModal;

    modal.classList.add("hidden");
    editingTaskId = null;
}

function createTaskElement(task) {
    let li = document.createElement("li");

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;


    checkbox.onclick = function () {
        toggleTask(task.id)
    }

    let span = document.createElement("span");


    const icon = getPriorityIcon(task.priority);

    let dateText = "";

    if (task.dueDate) {
        dateText = " 📅 " + task.dueDate;
    }

    span.textContent = icon + " " + task.text + dateText;

    let today = getToday();
    let taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    if
        (isOverdue(task)) {
        span.classList.add("overdue");
        span.textContent += " ⛔ OVERDUE";

    }

    else if (isDueToday(task)) {
        span.classList.add("due-today");
        span.textContent += " ⚠️Due Date";
    }

    if (task.done === true) {
        span.style.textDecoration = "line-through";
    }


    let button = document.createElement("button");
    button.textContent = "❌";
    button.classList.add("task-btn");

    let editButton = document.createElement("button");
    editButton.textContent = "✏️";
    editButton.classList.add("task-btn");

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(button);
    li.appendChild(editButton);
    if (task.id === selectedTaskId) {
        li.classList.add("selected");

        const detailsDiv = document.createElement("div");
        detailsDiv.classList.add("inline-details");

        detailsDiv.innerHTML = getTaskDetailsHtml(task);

        li.appendChild(detailsDiv);
    }

    editButton.onclick = function () {
        openEditModal(task.id);
    }


    span.onclick = function () {
        selectTask(task.id)


    }
    button.onclick = function () {
        deleteTask(task.id);
    }
    return li;

}

function addTask() {
    const priority = priorityInput.value;
    const input = taskInput;
    let value = input.value;
    const dueDate = dueDateInput.value;
    let notes = notesInput.value;
    value = value.trim();
    notes = notes.trim();
    if (value === "") {
        alert("Please enter a task");
        return;
    }
    let newTask = {
        id: Date.now(),
        text: value,
        done: false,
        priority,
        dueDate,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);
    input.value = "";
    input.focus();
    priorityInput.value = "medium";
    dueDateInput.value = "";
    notesInput.value = "";

    updateApp();



}
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && editingTaskId !== null) {
        closeEditModal();
    }
});
const modal = editModal;

modal.addEventListener("click", function (event) {
    if (event.target === modal) {
        closeEditModal();
    }
});
editInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        saveEditedTask();
    }
});
saveEditBtn.addEventListener("click", saveEditedTask);
sortSelect.onchange = function () {
    setSort(sortSelect.value);
}
cancelEditBtn.addEventListener("click", closeEditModal);

document.addEventListener("click", function (event) {
    if (!event.target.closest("li")) {
        selectedTaskId = null;
        renderTasks();
    }
});
