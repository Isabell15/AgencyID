// Obtener el formulario y la tabla
const searchForm = document.getElementById('searchForm');
const resultsTable = document.getElementById('resultsTable');
const resultsTableBody = resultsTable.querySelector('tbody');

// Función para manejar el envío del formulario
searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Obtener valores del formulario
    const uso = document.getElementById('uso').value;
    const precio = document.getElementById('precio').value;
    const consumo = document.getElementById('consumo').value;


    // Verificar que el precio sea un número
    if (isNaN(precio) || precio <= 0) {
        alert("Por favor, ingresa un precio válido.");
        return;
    }

    // Enviar solicitud GET al servidor
    try {
        const response = await fetch(`http://agencyid.site:3000/api/autos/buscar?uso=${uso}&precio=${precio}&consumo=${consumo}`);


        if (!response.ok) {
            throw new Error("No se encontraron autos con esos parámetros.");
        }

        const autos = await response.json();
        displayResults(autos);
    } catch (error) {
        alert(error.message);
        resultsTable.style.display = 'none';
    }
});

// Función para mostrar los resultados en la tabla
function displayResults(autos) {
    // Limpiar la tabla antes de agregar nuevos resultados
    resultsTableBody.innerHTML = '';

    // Si no hay resultados
    if (autos.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7">No se encontraron autos con esos parámetros.</td>';
        resultsTableBody.appendChild(row);
        resultsTable.style.display = 'block';
        return;
    }

    // Llenar la tabla con los resultados
    autos.forEach(auto => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${auto.marca}</td>
            <td>${auto.modelo}</td>
            <td>${auto.tipo}</td>
            <td>${auto.precio}</td>
            <td>${auto.año}</td>
            <td>${auto.uso}</td>
            <td>${auto.consumo}</td>
            <td>
                <img src="${auto.imagen}" alt="Imagen de ${auto.marca} ${auto.modelo}" 
                     style="width: 100px; height: auto; border-radius: 5px;">
            </td>
        `;
        resultsTableBody.appendChild(row);
    });

    // Mostrar la tabla
    resultsTable.style.display = 'table';
}
