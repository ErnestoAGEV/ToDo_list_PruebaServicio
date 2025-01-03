import { ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const db = window.db;
const auth = window.auth;

// Función para verificar si el dispositivo está en línea
function isOnline() {
    return navigator.onLine;
}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            logoutButton.disabled = true;
            logoutButton.textContent = "Cerrando sesión...";
            
            // Verifica si el usuario está autenticado antes de intentar cerrar sesión
            const user = auth.currentUser;
            if (user) {
                await signOut(auth);
                console.log("Sesión cerrada exitosamente");
                window.location.href = "./logout.html";  // Redirige al login después de cerrar sesión
            } else {
                console.log("No hay ningún usuario autenticado");
                alert("No hay sesión activa.");
                logoutButton.disabled = false;
                logoutButton.textContent = "Cerrar sesión";
            }
        } catch (error) {
            console.error("Error al cerrar la sesión:", error);
            logoutButton.disabled = false;
            logoutButton.textContent = "Cerrar sesión";
            alert("Error al cerrar la sesión. Por favor, intenta nuevamente.");
        }
    });
}


// Guardar tarea en el almacenamiento local
function saveTaskToLocalStorage(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Eliminar tarea del almacenamiento local
function removeTaskFromLocalStorage(taskText) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.texto !== taskText);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Sincronizar tareas con Firebase
function syncTasks() {
    if (isOnline()) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach((task) => {
            const userId = auth.currentUser.uid;
            const newTaskRef = push(ref(db, `tareas/${userId}`));
            set(newTaskRef, task)
            .then(() => {
                console.log("Tarea sincronizada con éxito en Firebase:", task);
                removeTaskFromLocalStorage(task.texto);
            })
            .catch((error) => {
                console.error("Error al sincronizar la tarea con Firebase:", error);
            });
        });
    }
}

window.addEventListener('online', () => {
 syncTasks();   
} );


// Agregar tarea
function addTask() {
    let taskText = document.getElementById("tarea").value;

    if (taskText === "") {
        return;
    }

    let task = {
        texto: taskText,
        completada: false
    };

    const userId = auth.currentUser.uid;

    if (isOnline()) {
        const newTaskRef = push(ref(db, `tareas/${userId}`));
        set(newTaskRef, task)
        .then(() => {
            console.log("Tarea agregada a Firebase:", taskText);
        })
        .catch((error) => {
            console.error("Error al agregar la tarea a Firebase:", error);
        });
    } else {
        saveTaskToLocalStorage(task);
        addTaskToDOM(task.texto);
        console.log("Tarea guardada localmente:", taskText);
    }

    document.getElementById('tarea').value = '';
}

// Añadir tarea al DOM
function addTaskToDOM(taskText, key) {
    let taskList = document.getElementById("listaTareas");

    let existingTasks = Array.from(taskList.children);
    if (existingTasks.some(item => item.textContent.includes(taskText))) {
        return;
    }

    let listItem = document.createElement("li");
    listItem.className = "list-group-item d-flex justify-content-between align-items-center";
    listItem.innerText = taskText;

    let deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger btn-sm";
    deleteButton.appendChild(document.createTextNode("Borrar "));
    deleteButton.onclick = () => {
        if (isOnline() && key) {
            const userId = auth.currentUser.uid;
            remove(ref(db, `tareas/${userId}/${key}`))
            .then(() => {
                console.log("Tarea eliminada de Firebase:", key);
            })
            .catch((error) => {
                console.error("Error al eliminar la tarea de Firebase:", error);
            });
        }
        removeTaskFromLocalStorage(taskText);
        listItem.remove();
    };

    listItem.appendChild(deleteButton);
    taskList.appendChild(listItem);
}

// Manejar la tecla Enter para agregar tarea
function handleKeyDown(event) {
    if (event.key === "Enter") {
        addTask();
    }
}

// Cargar las tareas
function loadTasks() {
    let taskList = document.getElementById("listaTareas");
    taskList.innerHTML = '';  // Limpiar la lista de tareas

    const userId = auth.currentUser ? auth.currentUser.uid : null;

    if (isOnline() && userId) {
        const tareasRef = ref(db, `tareas/${userId}`);
        onValue(tareasRef, (snapshot) => {
            taskList.innerHTML = '';  // Limpiar la lista cada vez que se actualiza
            snapshot.forEach((childSnapshot) => {
                const taskKey = childSnapshot.key;
                const task = childSnapshot.val();
                addTaskToDOM(task.texto, taskKey);
            });
        });
    } else {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addTaskToDOM(task.texto));
    }
}

// Inicializar la carga de tareas cuando se autentique el usuario
auth.onAuthStateChanged((user) => {
    if (user) {
        loadTasks();
        syncTasks();  // Sincronizar las tareas locales con Firebase
    } else {
        window.location.href = "/login.html";
    }
});

window.addTask = addTask;
window.handleKeyDown = handleKeyDown;
