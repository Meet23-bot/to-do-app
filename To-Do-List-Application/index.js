const taskList = document.getElementById("taskList");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const submitBtn = document.getElementById("submitBtn");
const editTaskBtn = document.getElementById("editTask");
const tasksHeading = document.getElementById("heading-tasks");
const searchBar = document.getElementById("searchBar");
const modeToggleBtn = document.getElementById("modeToggle");
const taskActions = document.getElementById("taskActions");

const priorityColors = {
  High: "task-priority-High",
  Medium: "task-priority-Medium",
  Low: "task-priority-Low",
};

const priorityValues = {
  High: 3,
  Medium: 2,
  Low: 1,
};

let tasks = [];
let editTaskId = null;
let initialized = false;

function isPastDate(dateString) {
  if (!dateString) return false;
  const selected = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function buildTaskElement(task) {
  const li = document.createElement("li");
  li.className = `list-group-item card shadow mb-4 bg-transparent ${priorityColors[task.priority] || priorityColors.Low}`;
  li.dataset.taskId = task.id;
  if (task.completed) li.classList.add("task-completed");

  const completeCheckbox = document.createElement("input");
  completeCheckbox.type = "checkbox";
  completeCheckbox.className = "form-check-input task-completed";
  completeCheckbox.checked = Boolean(task.completed);
  completeCheckbox.addEventListener("change", markAsComplete);

  const titleNode = document.createTextNode(task.text);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-outline-danger float-right delete";
  deleteButton.innerHTML = '<ion-icon name="trash-outline" style="font-size: 20px"></ion-icon>';
  deleteButton.style.paddingTop = "10px";
  deleteButton.style.PaddingRight = "10px";

  const editButton = document.createElement("button");
  editButton.className = "btn btn-outline-secondary btn-sm float-right edit";
  editButton.innerHTML = '<ion-icon name="create-outline" style="font-size: 20px"></ion-icon>';
  editButton.style.marginRight = "8px";
  editButton.style.paddingTop = "10px";
  editButton.style.PaddingRight = "10px";
  if (task.completed) editButton.style.display = "none";

  const descriptionParagraph = document.createElement("p");
  descriptionParagraph.className = "text-muted";
  descriptionParagraph.id = "description-at";
  descriptionParagraph.style.fontSize = "15px";
  descriptionParagraph.style.margin = "0 19px";
  descriptionParagraph.textContent = task.description
    ? `Description: ${task.description}`
    : "";

  const dateTimeParagraph = document.createElement("p");
  dateTimeParagraph.className = "text-muted";
  dateTimeParagraph.id = "created-at";
  dateTimeParagraph.style.fontSize = "15px";
  dateTimeParagraph.style.margin = "0 19px";
  dateTimeParagraph.textContent = `Created: ${new Date(task.createdAt).toLocaleString()}`;

  const dueDateParagraph = document.createElement("p");
  dueDateParagraph.className = "text-muted";
  dueDateParagraph.id = "task-dueDate";
  dueDateParagraph.style.fontSize = "15px";
  dueDateParagraph.style.margin = "0 19px";
  dueDateParagraph.textContent = `Due Date: ${task.dueDate}`;

  const priorityParagraph = document.createElement("p");
  priorityParagraph.className = "text-muted";
  priorityParagraph.id = "task-priority";
  priorityParagraph.style.fontSize = "15px";
  priorityParagraph.style.margin = "0 19px";
  priorityParagraph.textContent = task.priority;

  li.appendChild(completeCheckbox);
  li.appendChild(titleNode);
  li.appendChild(deleteButton);
  li.appendChild(editButton);
  li.appendChild(descriptionParagraph);
  li.appendChild(dateTimeParagraph);
  li.appendChild(dueDateParagraph);
  li.appendChild(priorityParagraph);
  return li;
}

function renderTasks(taskSource = tasks) {
  taskList.innerHTML = "";
  taskSource.forEach((task) => {
    taskList.appendChild(buildTaskElement(task));
  });
  const hasTasks = taskSource.length > 0;
  taskActions.style.display = hasTasks ? "block" : "none";
}

async function loadTasksFromServer() {
  tasks = await apiRequest("/api/tasks");
  renderTasks(tasks);
}

function displaySuccessMessage(message) {
  document.getElementById("lblsuccess").innerHTML = message;
  document.getElementById("lblsuccess").style.display = "block";
  setTimeout(() => {
    document.getElementById("lblsuccess").style.display = "none";
  }, 3000);
}

function displayErrorMessage(message) {
  document.getElementById("lblerror").innerHTML = message;
  document.getElementById("lblerror").style.display = "block";
  setTimeout(() => {
    document.getElementById("lblerror").style.display = "none";
  }, 3000);
}

function readFormValues() {
  return {
    text: document.getElementById("item").value.trim(),
    description: document.getElementById("description").value.trim(),
    dueDate: dueDateInput.value,
    priority: priorityInput.value,
  };
}

function resetForm() {
  document.getElementById("item").value = "";
  document.getElementById("description").value = "";
  dueDateInput.value = "";
  priorityInput.value = "";
  submitBtn.disabled = true;
}

function validateTaskInput({ text, dueDate, priority }) {
  if (!text) {
    displayErrorMessage("Task Title should be filled.");
    return false;
  }
  if (!dueDate) {
    displayErrorMessage("Please specify a due date.");
    return false;
  }
  if (isPastDate(dueDate)) {
    displayErrorMessage("Due date has already passed.");
    return false;
  }
  if (!priority) {
    displayErrorMessage("Please select a priority.");
    return false;
  }
  return true;
}

async function addItem(e) {
  e.preventDefault();
  const values = readFormValues();
  if (!validateTaskInput(values)) return;

  try {
    const createdTask = await apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ ...values, completed: false }),
    });
    tasks.push(createdTask);
    renderTasks(tasks);
    resetForm();
    displaySuccessMessage("Task added successfully.");
  } catch (error) {
    displayErrorMessage(error.message);
  }
}

function startEditTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  document.getElementById("item").value = task.text;
  document.getElementById("description").value = task.description || "";
  dueDateInput.value = task.dueDate || "";
  priorityInput.value = task.priority || "";
  editTaskId = taskId;
  document.getElementById("maintitle").innerText = "Edit your tasks below :";
  editTaskBtn.style.display = "inline";
  submitBtn.style.display = "none";
  document.documentElement.scrollTop = 0;
  document.getElementById("item").focus();
}

async function handleEditClick(e) {
  e.preventDefault();
  if (!editTaskId) return;

  const values = readFormValues();
  if (!validateTaskInput(values)) return;

  try {
    const updatedTask = await apiRequest(`/api/tasks/${editTaskId}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });

    tasks = tasks.map((task) => (task.id === editTaskId ? updatedTask : task));
    renderTasks(tasks);
    displaySuccessMessage("Task edited successfully.");

    editTaskId = null;
    resetForm();
    document.getElementById("maintitle").innerText = "Add your tasks below :";
    editTaskBtn.style.display = "none";
    submitBtn.style.display = "inline";
  } catch (error) {
    displayErrorMessage(error.message);
  }
}

async function removeTask(taskId) {
  try {
    await apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
    tasks = tasks.filter((task) => task.id !== taskId);
    renderTasks(tasks);
    displaySuccessMessage("Task deleted successfully.");
  } catch (error) {
    displayErrorMessage(error.message);
  }
}

function handleItemClick(e) {
  const deleteButton = e.target.closest(".delete");
  const editButton = e.target.closest(".edit");
  if (!deleteButton && !editButton) return;

  const li = e.target.closest("li");
  if (!li) return;
  const taskId = li.dataset.taskId;

  if (editButton) {
    startEditTask(taskId);
    return;
  }

  const confirmationBox = document.getElementById("custom-confirm");
  const confirmYesButton = document.getElementById("confirm-yes");
  const confirmNoButton = document.getElementById("confirm-no");
  const confirmCancelButton = document.getElementById("confirm-cancel");

  const closeModal = () => {
    confirmationBox.style.display = "none";
    confirmYesButton.removeEventListener("click", handleYesClick);
    confirmNoButton.removeEventListener("click", handleNoClick);
    confirmCancelButton.removeEventListener("click", handleCancelClick);
  };

  const handleYesClick = async () => {
    closeModal();
    await removeTask(taskId);
  };
  const handleNoClick = () => closeModal();
  const handleCancelClick = () => closeModal();

  confirmYesButton.addEventListener("click", handleYesClick);
  confirmNoButton.addEventListener("click", handleNoClick);
  confirmCancelButton.addEventListener("click", handleCancelClick);
  confirmationBox.style.display = "flex";
}

async function markAsComplete(e) {
  const li = e.target.closest("li");
  if (!li) return;
  const taskId = li.dataset.taskId;
  const isCompleted = e.target.checked;

  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  try {
    const updatedTask = await apiRequest(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ completed: isCompleted }),
    });
    tasks = tasks.map((item) => (item.id === taskId ? updatedTask : item));
    renderTasks(tasks);
  } catch (error) {
    e.target.checked = !isCompleted;
    displayErrorMessage(error.message);
  }
}

function handleSearch() {
  const searchTerm = searchBar.value.toLowerCase().trim();
  if (!searchTerm) {
    renderTasks(tasks);
    return;
  }
  const filtered = tasks.filter((task) => task.text.toLowerCase().includes(searchTerm));
  renderTasks(filtered);
}

function sortByDueDate(order) {
  const sorted = [...tasks].sort((a, b) => {
    const aDate = new Date(a.dueDate);
    const bDate = new Date(b.dueDate);
    return order === "late" ? bDate - aDate : aDate - bDate;
  });
  renderTasks(sorted);
}

function sortByPriority(order) {
  const sorted = [...tasks].sort((a, b) => {
    const diff = priorityValues[b.priority] - priorityValues[a.priority];
    return order === "lowToHigh" ? -diff : diff;
  });
  renderTasks(sorted);
}

function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i += 1) {
      const openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

async function clearAllTasks() {
  const confirmationBoxAll = document.getElementById("custom-confirm-all");
  const confirmYesButtonAll = document.getElementById("confirm-yes-all");
  const confirmNoButtonAll = document.getElementById("confirm-no-all");
  const confirmCancelButtonAll = document.getElementById("confirm-cancel-all");

  if (tasks.length === 0) return;

  const closeModal = () => {
    confirmationBoxAll.style.display = "none";
    confirmYesButtonAll.removeEventListener("click", handleYesClick);
    confirmNoButtonAll.removeEventListener("click", handleNoClick);
    confirmCancelButtonAll.removeEventListener("click", handleCancelClick);
  };

  const handleYesClick = async () => {
    closeModal();
    try {
      await apiRequest("/api/tasks", { method: "DELETE" });
      tasks = [];
      renderTasks(tasks);
      displaySuccessMessage("All tasks cleared.");
    } catch (error) {
      displayErrorMessage(error.message);
    }
  };
  const handleNoClick = () => closeModal();
  const handleCancelClick = () => closeModal();

  confirmYesButtonAll.addEventListener("click", handleYesClick);
  confirmNoButtonAll.addEventListener("click", handleNoClick);
  confirmCancelButtonAll.addEventListener("click", handleCancelClick);

  confirmationBoxAll.style.display = "flex";
}

function toggleMode() {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
  if (modeToggleBtn.checked === true) {
    localStorage.setItem("dark-mode", "enabled");
  } else {
    localStorage.setItem("dark-mode", null);
  }
}

function themeSwitcher() {
  if (localStorage.length === 0) {
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (prefersDarkScheme.matches) {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("dark-mode", "enabled");
      modeToggleBtn.checked = true;
    } else {
      document.body.classList.toggle("light-mode");
      localStorage.setItem("dark-mode", null);
    }
  } else if (localStorage.getItem("dark-mode") === "enabled") {
    document.body.classList.toggle("dark-mode");
    modeToggleBtn.checked = true;
  } else {
    document.body.classList.toggle("light-mode");
  }
}

function enableSubmit(_ref, btnID) {
  document.getElementById(btnID).disabled = false;
}

function init() {
  if (initialized) return;
  initialized = true;
  if (typeof window.flatpickr === "function") {
    flatpickr(dueDateInput, {
      enableTime: false,
      dateFormat: "Y-m-d",
    });
  }
  taskList.addEventListener("click", handleItemClick);
  searchBar.addEventListener("input", handleSearch);
  submitBtn.addEventListener("click", addItem);
  editTaskBtn.addEventListener("click", handleEditClick);
  modeToggleBtn.addEventListener("change", toggleMode);
  loadTasksFromServer().catch((error) => displayErrorMessage(error.message));
}

themeSwitcher();

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    document.querySelector(".preloader").style.display = "none";
  }, 2000);
});

document.addEventListener("DOMContentLoaded", function () {
  const headerText = "To-Do List Application";
  const headerElement = document.getElementById("todo-header");
  if (!headerElement) return;

  function typeText(text, index) {
    headerElement.textContent = text.slice(0, index);
    if (index < text.length) {
      setTimeout(function () {
        typeText(text, index + 1);
      }, 50);
    }
  }

  typeText(headerText, 0);
});
