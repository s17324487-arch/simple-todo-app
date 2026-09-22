import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// --- Auth elements ---
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authError = document.getElementById("auth-error");
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const userEmailLabel = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// --- Todo elements ---
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const remainingCount = document.getElementById("remaining-count");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter-btn");

let authMode = "login"; // "login" | "signup"
let todos = [];
let currentFilter = "all";
let unsubscribeTodos = null;

const ERROR_MESSAGES = {
  "auth/invalid-email": "メールアドレスの形式が正しくありません",
  "auth/missing-password": "パスワードを入力してください",
  "auth/weak-password": "パスワードは6文字以上にしてください",
  "auth/email-already-in-use": "このメールアドレスは既に登録されています",
  "auth/invalid-credential": "メールアドレスまたはパスワードが違います",
  "auth/too-many-requests": "試行回数が多すぎます。しばらく待ってから再試行してください",
};

function authErrorMessage(err) {
  return ERROR_MESSAGES[err.code] || "エラーが発生しました。もう一度お試しください";
}

// --- Auth tab switching ---
function setAuthMode(mode) {
  authMode = mode;
  authError.textContent = "";
  if (mode === "login") {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    authSubmit.textContent = "ログイン";
    authPassword.autocomplete = "current-password";
  } else {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    authSubmit.textContent = "登録する";
    authPassword.autocomplete = "new-password";
  }
}

tabLogin.addEventListener("click", () => setAuthMode("login"));
tabSignup.addEventListener("click", () => setAuthMode("signup"));

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  authSubmit.disabled = true;
  const email = authEmail.value.trim();
  const password = authPassword.value;

  try {
    if (authMode === "signup") {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    authError.textContent = authErrorMessage(err);
  } finally {
    authSubmit.disabled = false;
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

// --- Auth state -> switch screens & wire Firestore listener ---
onAuthStateChanged(auth, (user) => {
  if (unsubscribeTodos) {
    unsubscribeTodos();
    unsubscribeTodos = null;
  }

  if (user) {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    userEmailLabel.textContent = user.email;
    authForm.reset();
    subscribeTodos(user.uid);
  } else {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    todos = [];
    render();
  }
});

// --- Firestore sync ---
function subscribeTodos(uid) {
  const todosRef = collection(db, "users", uid, "todos");
  const q = query(todosRef, orderBy("createdAt", "asc"));
  unsubscribeTodos = onSnapshot(q, (snapshot) => {
    todos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  });
}

function currentUid() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

async function addTodo(text) {
  const uid = currentUid();
  if (!uid) return;
  await addDoc(collection(db, "users", uid, "todos"), {
    text,
    done: false,
    createdAt: serverTimestamp(),
  });
}

async function toggleTodo(id, done) {
  const uid = currentUid();
  if (!uid) return;
  await updateDoc(doc(db, "users", uid, "todos", id), { done: !done });
}

async function deleteTodo(id) {
  const uid = currentUid();
  if (!uid) return;
  await deleteDoc(doc(db, "users", uid, "todos", id));
}

// --- Rendering ---
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
      checkbox.checked = !!todo.done;
      checkbox.addEventListener("change", () => toggleTodo(todo.id, todo.done));

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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

clearDoneBtn.addEventListener("click", () => {
  todos.filter((t) => t.done).forEach((t) => deleteTodo(t.id));
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
