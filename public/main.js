import { ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Usar la instancia global de Firebase
const db = window.db;

// Verifica si el dispositivo está en línea
function isOnline() {
    return navigator.onLine;
}

function guardarTareaOffline(tarea) {
    let tareas = JSON.parse(localStorage.getItem('tareasOffline')) || [];
    tareas.push(tarea);
    localStorage.setItem('tareasOffline', JSON.stringify(tareas));
}

function sincronizarTareas() {
    let tareas = JSON.parse(localStorage.getItem('tareasOffline')) || [];
    tareas.forEach((tarea) => {
        const newTaskRef = push(ref(db, 'tareas'));
        set(newTaskRef, tarea)
        .then(() => {
            console.log("Tarea sincronizada correctamente a Firebase:", tarea);
        })
        .catch((error) => {
            console.error("Error al sincronizar tarea a Firebase:", error);
        });
    });
    // Limpiar las tareas locales después de la sincronización
    localStorage.removeItem('tareasOffline');
}

function mostrarTarea() {
    let elementoTarea = document.getElementById("tarea").value;

    if (elementoTarea === "") {
        return;
    }

    let tarea = {
        texto: elementoTarea,
        completada: false
    };

    if (isOnline()) {
        // Añadir tarea a Firebase si está en línea
        const newTaskRef = push(ref(db, 'tareas'));
        set(newTaskRef, tarea)
        .then(() => {
            console.log("Tarea añadida correctamente a Firebase:", elementoTarea);
        })
        .catch((error) => {
            console.error("Error al añadir tarea a Firebase:", error);
        });
    } else {
        // Guardar tarea en local storage si está offline
        guardarTareaOffline(tarea);
        agregarTareaLocal(tarea.texto);  // Mostrar tarea offline en el DOM
        console.log("Tarea guardada offline:", elementoTarea);
    }

    // Limpiar el campo de entrada
    document.getElementById('tarea').value = '';
}

function agregarTareaLocal(textoTarea, key) {
    let elementoLista = document.getElementById("listaTareas");

    let itemLista = document.createElement("li");
    itemLista.className = "list-group-item d-flex justify-content-between align-items-center";
    itemLista.innerText = textoTarea;

    let eliminar = document.createElement("button");
    eliminar.className = "btn btn-danger btn-sm";
    eliminar.appendChild(document.createTextNode("Borrar Tarea"));
    eliminar.onclick = () => {
        // Eliminar tarea de Firebase
        remove(ref(db, `tareas/${key}`))
        .then(() => {
            console.log("Tarea eliminada correctamente de Firebase:", key);
        })
        .catch((error) => {
            console.error("Error al eliminar tarea de Firebase:", error);
        });
        itemLista.remove();
    };

    itemLista.appendChild(eliminar);
    elementoLista.appendChild(itemLista);
}

function cargarTareas() {
    let elementoLista = document.getElementById("listaTareas");

    console.log("Cargando tareas desde Firebase...");
    
    // Escuchar cambios en Firebase
    onValue(ref(db, 'tareas'), (snapshot) => {
        // Limpiar la lista actual antes de cargar nuevas tareas
        elementoLista.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            let tarea = childSnapshot.val();
            let key = childSnapshot.key;
            
            // Agregar la tarea al DOM
            agregarTareaLocal(tarea.texto, key);
        });
    }, (error) => {
        console.error("Error al leer datos desde Firebase:", error);
    });
}

// Escuchar cambios en la conexión
window.addEventListener('online', sincronizarTareas);

// Asignar el evento 'keydown' para agregar la tarea con "Enter"
document.getElementById('tarea').addEventListener('keydown', function(event){
    if(event.key === 'Enter') {
        mostrarTarea();
    }
});

// Cargar tareas cuando la página se carga
window.onload = cargarTareas;

// Hacer las funciones accesibles globalmente
window.mostrarTarea = mostrarTarea;
