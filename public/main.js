import { ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Use the global Firebase instance
const db = window.db;
const auth = window.auth;

// Check if the device is online
function isOnline() {
    return navigator.onLine;
}

// Logout user and redirect to login page
document.getElementById("logoutButton").addEventListener("click", () => {
    signOut(auth).then(() => {
        console.log("Sesión cerrada exitosamente");
        window.location.href = "/login.html"; // Redirigir a la página de login
    }).catch((error) => {
        console.error("Error al cerrar la sesión:", error);
    });
});

// Save task to local storage
function saveTaskToLocalStorage(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Remove task from local storage
function removeTaskFromLocalStorage(taskText) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.texto !== taskText);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Synchronize tasks with Firebase
function syncTasks() {
    if (isOnline()) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach((task) => {
            const newTaskRef = push(ref(db, 'tareas'));
            set(newTaskRef, task)
            .then(() => {
                console.log("Task synced successfully to Firebase:", task);
                removeTaskFromLocalStorage(task.texto);
            })
            .catch((error) => {
                console.error("Error syncing task to Firebase:", error);
            });
        });
    }
}

function addTask() {
    let taskText = document.getElementById("tarea").value;

    if (taskText === "") {
        return;
    }

    let task = {
        texto: taskText,
        completada: false
    };

    if (isOnline()) {
        // Add task to Firebase if online
        const newTaskRef = push(ref(db, 'tareas'));
        set(newTaskRef, task)
        .then(() => {
            console.log("Task added successfully to Firebase:", taskText);
        })
        .catch((error) => {
            console.error("Error adding task to Firebase:", error);
        });
    } else {
        // Save task locally if offline
        saveTaskToLocalStorage(task);
        // Add task to DOM immediately when offline
        addTaskToDOM(task.texto);
        console.log("Task saved offline:", taskText);
    }

    // Clear the input field
    document.getElementById('tarea').value = '';
}

function addTaskToDOM(taskText, key) {
    let taskList = document.getElementById("listaTareas");

    // Check if the task already exists in the DOM
    let existingTasks = Array.from(taskList.children);
    if (existingTasks.some(item => item.textContent.includes(taskText))) {
        return; // Task already exists, don't add it again
    }

    let listItem = document.createElement("li");
    listItem.className = "list-group-item d-flex justify-content-between align-items-center";
    listItem.innerText = taskText;

    let deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger btn-sm";
    deleteButton.appendChild(document.createTextNode("Borrar "));
    deleteButton.onclick = () => {
        if (isOnline() && key) {
            // Remove task from Firebase
            remove(ref(db, `tareas/${key}`))
            .then(() => {
                console.log("Task deleted successfully from Firebase:", key);
            })
            .catch((error) => {
                console.error("Error deleting task from Firebase:", error);
            });
        }
        // Remove task from local storage
        removeTaskFromLocalStorage(taskText);
        listItem.remove();
    };

    listItem.appendChild(deleteButton);
    taskList.appendChild(listItem);
}

function loadTasks() {
    let taskList = document.getElementById("listaTareas");

    // Clear the current list
    taskList.innerHTML = '';

    // Load tasks from local storage
    let localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    localTasks.forEach(task => addTaskToDOM(task.texto));

    if (isOnline()) {
        console.log("Loading tasks from Firebase...");
        
        // Listen for changes in Firebase
        onValue(ref(db, 'tareas'), (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                let task = childSnapshot.val();
                let key = childSnapshot.key;
                
                // Add the task to DOM
                addTaskToDOM(task.texto, key);
            });
        }, (error) => {
            console.error("Error loading tasks from Firebase:", error);
        });
    }
}

// Load tasks when the page loads
window.addEventListener('load', loadTasks);
