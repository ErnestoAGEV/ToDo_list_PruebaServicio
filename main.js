//En lugar de guardar las tareas como un DOM ahora se guardan en arrays  para poder hacer la conversion con JSON de manera mas sencilla.
function mostrarTarea() {
    let elementoLista = document.getElementById("listaTareas");
    let elementoTarea = document.getElementById("tarea").value;

    if (elementoTarea === "") {
        return;
    }

    // Crear elemento de lista
    let itemLista = document.createElement("li");
    itemLista.className = "list-group-item d-flex justify-content-between align-items-center";
    itemLista.innerText = elementoTarea;

    // Crear botón de eliminar con clases de Bootstrap
    let eliminar = document.createElement("button");
    eliminar.className = "btn btn-danger btn-sm"; // Clases de Bootstrap para el botón
    eliminar.appendChild(document.createTextNode("Borrar Tarea"));
    eliminar.onclick = () => {
        itemLista.remove();
        actualizarLocalStorage();
    };

    // Añadir el botón al item de la lista
    itemLista.appendChild(eliminar);
    elementoLista.appendChild(itemLista);

    // Limpiar el campo de entrada
    document.getElementById('tarea').value = '';

    // Actualizar LocalStorage
    actualizarLocalStorage();
}

function actualizarLocalStorage() {
    let listaTareas = document.getElementById("listaTareas").getElementsByTagName("li");
    let tareasArray = [];

    // Convertir las tareas en un array de textos
    for (let i = 0; i < listaTareas.length; i++) {
        tareasArray.push(listaTareas[i].childNodes[0].nodeValue);
    }

    // Guardar en localStorage
    localStorage.setItem('LocalTareas', JSON.stringify(tareasArray));
}

function cargarTareas() {
    let tareasGuardadas = JSON.parse(localStorage.getItem('LocalTareas'));

    if (tareasGuardadas) {
        let elementoLista = document.getElementById("listaTareas");

        tareasGuardadas.forEach(tarea => {
            let itemLista = document.createElement("li");
            itemLista.className = "list-group-item d-flex justify-content-between align-items-center";
            itemLista.innerText = tarea;

            let eliminar = document.createElement("button");
            eliminar.className = "btn btn-danger btn-sm";
            eliminar.appendChild(document.createTextNode("Borrar Tarea"));
            eliminar.onclick = () => {
                itemLista.remove();
                actualizarLocalStorage();
            };

            itemLista.appendChild(eliminar);
            elementoLista.appendChild(itemLista);
        });
    }
}

// Cargar tareas cuando la página se carga
window.onload = cargarTareas;
