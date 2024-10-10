import { ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Use the globally available db object
const db = window.db;

function mostrarTarea() {
    let elementoTarea = document.getElementById("tarea").value;
    
    if (elementoTarea === "") {
        return;
    }
    
    // Añadir tarea a Firebase
    const newTaskRef = push(ref(db, 'tareas'));
    set(newTaskRef, {
        texto: elementoTarea,
        completada: false
    })
    .then(() => {
        console.log("Tarea añadida correctamente a Firebase:", elementoTarea);
    })
    .catch((error) => {
        console.error("Error al añadir tarea a Firebase:", error);
    });

    // Añadir tarea al DOM y localStorage
    agregarTareaLocal(elementoTarea);
    
    // Limpiar el campo de entrada
    document.getElementById('tarea').value = '';
}

function agregarTareaLocal(textoTarea) {
    let elementoLista = document.getElementById("listaTareas");
    
    let itemLista = document.createElement("li");
    itemLista.className = "list-group-item d-flex justify-content-between align-items-center";
    itemLista.innerText = textoTarea;
    
    let eliminar = document.createElement("button");
    eliminar.className = "btn btn-danger btn-sm";
    eliminar.appendChild(document.createTextNode("Borrar Tarea"));
    eliminar.onclick = () => {
        itemLista.remove();
        actualizarLocalStorage();
    };
    
    itemLista.appendChild(eliminar);
    elementoLista.appendChild(itemLista);
    
    actualizarLocalStorage();
}

function actualizarLocalStorage() {
    let listaTareas = document.getElementById("listaTareas").getElementsByTagName("li");
    let tareasArray = [];
    
    for (let i = 0; i < listaTareas.length; i++) {
        tareasArray.push(listaTareas[i].childNodes[0].nodeValue);
    }
    
    localStorage.setItem('LocalTareas', JSON.stringify(tareasArray));
}

function cargarTareas() {
    let elementoLista = document.getElementById("listaTareas");

    console.log("Cargando tareas desde Firebase...");
    
    // Cargar tareas desde localStorage
    let tareasGuardadas = JSON.parse(localStorage.getItem('LocalTareas'));
    if (tareasGuardadas) {
        tareasGuardadas.forEach(tarea => {
            agregarTareaLocal(tarea);
        });
    }
    
    // Escuchar cambios en Firebase
    onValue(ref(db, 'tareas'), (snapshot) => {
        // Limpiar la lista actual
        elementoLista.innerHTML = '';
        
        snapshot.forEach((childSnapshot) => {
            let tarea = childSnapshot.val();
            let key = childSnapshot.key;
            
            let itemLista = document.createElement("li");
            itemLista.className = "list-group-item d-flex justify-content-between align-items-center";
            itemLista.innerText = tarea.texto;
            
            let eliminar = document.createElement("button");
            eliminar.className = "btn btn-danger btn-sm";
            eliminar.appendChild(document.createTextNode("Borrar Tarea"));
            eliminar.onclick = () => {
                remove(ref(db, `tareas/${key}`))
                .then(() => {
                    console.log("Tarea eliminada correctamente de Firebase:", key);
                })
                .catch((error) => {
                    console.error("Error al eliminar tarea de Firebase:", error);
                });
                itemLista.remove();
                actualizarLocalStorage();
            };
            
            itemLista.appendChild(eliminar);
            elementoLista.appendChild(itemLista);
        });
        
        // Actualizar localStorage después de cargar desde Firebase
        actualizarLocalStorage();
    }, (error) => {
        console.error("Error al leer datos desde Firebase:", error);
    });
}

document.getElementById('tarea').addEventListener('keydown', function(event){
    if(event.key === 'Enter') {
        mostrarTarea();
    }
});

// Cargar tareas cuando la página se carga
window.onload = cargarTareas;

// Make functions globally available
window.mostrarTarea = mostrarTarea;
