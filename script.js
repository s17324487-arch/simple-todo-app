const STORAGE_KEY = "simple-todo-items";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const remainingCount = document.getElementById("remaining-count");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = loadTodos();
let currentFilter = "all";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // ignore storage errors
  }
}

function render() {
  list.innerHTML = "";

  const filtered = todos.filter((t) => {
    if (currentFilter === "active") return !t.done;
    if (currentFilter === "done") return t.done;
    return true;
  });

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-msg";
    li.textContent = "タスクがありません";
    list.appendChild(li);
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement("li");
      li.className = todo.done ? "done" : "";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => toggleTodo(todo.id));

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => deleteTodo(todo.id));

      li.append(checkbox, span, delBtn);
      list.appendChild(li);
    });
  }

  const remaining = todos.filter((t) => !t.done).length;
  remainingCount.textContent = `${remaining}件残り`;
}

function addTodo(text) {
  todos.push({ id: Date.now(), text, done: false });
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

clearDoneBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  saveTodos();
  render();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();
