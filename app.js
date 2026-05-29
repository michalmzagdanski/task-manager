let tasks = [];

let editingTaskId = null;
let selectedTaskId = null;

let currentFilter = "all";
let currentSort = "priority";

let isLoadingTasks = false;
let hasLoadingError = false;
let priorityOrder = {
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
const taskDetails = document.getElementById("taskDetails");
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
    renderTaskDetails();
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
    return task.dueDate && task.done === false && taskDate < today;
}
function isDueToday(task) {
    const today = getToday();
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return task.dueDate && task.done === false && taskDate.getTime() === today.getTime();
}

function updateCounter(count) {
    counter.innerText =
        "Widoczne zadania: " + count;
}
function checkEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }

}
function saveTasks() {


    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));

    }
    catch {
        alert("Pamięć pełna!");

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
        tasksToShow = tasks.filter(task =>
            task.dueDate &&
            task.done === false &&
            new Date(task.dueDate) < today
        );

        tasksToShow.sort(function (a, b) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }
    if (currentFilter === "dueToday") {
        tasksToShow = tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);

            return task.dueDate &&
                task.done === false &&
                taskDate.getTime() === today.getTime();
        });

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
function renderTaskDetails() {
    if (!selectedTaskId) {
        taskDetails.innerHTML = "Wybierz zadanie";
        return;
    }
    const task = tasks.find(task => task.id === selectedTaskId);
    if (!task) {
        taskDetails.innerHTML = "Task nie istnieje";
        return;

    }
    const createdDate = new Date(task.createdAt);
    const updatedDate = new Date(task.updatedAt);
    taskDetails.innerHTML = `
            <h2>${task.text}</h2>
            <p>Priority: ${task.priority}</p>
            <p>Notes: ${task.notes || "Brak notatek"}</p>
            <p>Created: ${createdDate.toLocaleDateString()}</p>
            <p>Updated:${updatedDate.toLocaleDateString()}</p>`;
}





function renderTasks() {
    if (isLoadingTasks) {
        taskList.innerHTML = "<li>Loading tasks...</li>";
        return;
    }
    if (hasLoadingError) {
        taskList.innerHTML = `
                    <li>Nie udało się załadować tasków
                   <button id="retryBtn">Spróbuj ponownie</button>
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
        renderTaskDetails();

        taskList.innerHTML = "<li>Brak zadań</li>";

        return;
    }
    const isSelectedTaskVisible = tasksToShow.some(
        task => task.id === selectedTaskId
    );

    if (!isSelectedTaskVisible) {
        selectedTaskId = null;
    }



    renderTaskDetails();

    updateCounter(tasksToShow.length);

    for (let task of tasksToShow) {

        let li = createTaskElement(task);

        taskList.appendChild(li);
    }

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
        task.done = !task.done;
        updateApp()
    }

    let span = document.createElement("span");


    const icon = getPriorityIcon(task.priority);

    let dateText = "";

    if (task.dueDate) {
        dateText = " 📅 " + task.dueDate;
    }

    span.innerText = icon + " " + task.text + dateText;

    let today = getToday();
    let taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    if
        (isOverdue(task)) {
        span.style.color = "red";
        span.innerText += " ⛔ OVERDUE";

    }

    else if (isDueToday(task)) {
        span.style.color = "orange";
        span.innerText += " ⚠️Due Date";
    }

    if (task.done === true) {
        span.style.textDecoration = "line-through";
    }
    if (task.id === selectedTaskId) {
        li.style.backgroundColor = "lightgreen";
    }

    let button = document.createElement("button");
    button.innerText = "❌";

    let editButton = document.createElement("button");
    editButton.innerText = "✏️";

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(button);
    li.appendChild(editButton);

    editButton.onclick = function () {
        openEditModal(task.id);
    }


    span.onclick = function () {
        selectedTaskId = task.id;
        renderTaskDetails();
        renderTasks();
    }



    button.onclick = function () {
        let index = tasks.indexOf(task);
        tasks.splice(index, 1);
        updateApp()

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
        alert("Wpisz zadanie");
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
    notes: ""
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
