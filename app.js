document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const addFriendForm = document.getElementById('add-friend-form');
    const friendNameInput = document.getElementById('friend-name');
    const logBeerForm = document.getElementById('log-beer-form');
    const selectFriend = document.getElementById('select-friend');
    const beerDate = document.getElementById('beer-date');
    const beerBrand = document.getElementById('beer-brand');
    const beerQty = document.getElementById('beer-qty');
    const leaderboard = document.getElementById('leaderboard');

    // Por defecto, establecer la fecha de hoy en el formulario
    beerDate.valueAsDate = new Date();

    // Estructura de datos almacenada en localStorage
    let appData = JSON.parse(localStorage.getItem('beerTrackerData')) || {};

    // Guardar datos
    function saveData() {
        localStorage.setItem('beerTrackerData', JSON.stringify(appData));
    }

    // Actualizar selector de amigos
    function updateSelect() {
        selectFriend.innerHTML = '<option value="" disabled selected>Selecciona un amigo...</option>';
        Object.keys(appData).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            selectFriend.appendChild(option);
        });
    }

    // Actualizar el Ranking
    function updateLeaderboard() {
        leaderboard.innerHTML = '';
        const friends = Object.keys(appData);

        if (friends.length === 0) {
            leaderboard.innerHTML = '<p class="empty-state">Aún no hay sed. ¡Añade amigos y registra cervezas!</p>';
            return;
        }

        // Ordenar amigos por cantidad total de cervezas (mayor a menor)
        friends.sort((a, b) => appData[b].total - appData[a].total);

        friends.forEach(name => {
            const data = appData[name];
            // Encontrar la marca favorita (la más repetida)
            const brandCounts = {};
            let favoriteBrand = 'Ninguna';
            let maxCount = 0;

            data.logs.forEach(log => {
                brandCounts[log.brand] = (brandCounts[log.brand] || 0) + log.qty;
                if (brandCounts[log.brand] > maxCount) {
                    maxCount = brandCounts[log.brand];
                    favoriteBrand = log.brand;
                }
            });

            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="friend-info">
                    <strong>${name}</strong>
                    <div class="friend-stats">Favorita: ${favoriteBrand}</div>
                </div>
                <div class="total-beers">${data.total} 🍺</div>
            `;
            leaderboard.appendChild(item);
        });
    }

    // Evento: Agregar Amigo
    addFriendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = friendNameInput.value.trim();
        
        if (name && !appData[name]) {
            appData[name] = { total: 0, logs: [] };
            saveData();
            updateSelect();
            updateLeaderboard();
            friendNameInput.value = '';
        } else if (appData[name]) {
            alert('¡Ese amigo ya está en la lista!');
        }
    });

    // Evento: Registrar Cervezas
    logBeerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = selectFriend.value;
        const date = beerDate.value;
        const brand = beerBrand.value.trim();
        const qty = parseInt(beerQty.value);

        if (name && date && brand && qty > 0) {
            appData[name].total += qty;
            appData[name].logs.push({ date, brand, qty });
            
            saveData();
            updateLeaderboard();
            
            // Limpiar campos (menos el amigo y la fecha por comodidad)
            beerBrand.value = '';
            beerQty.value = '';
        }
    });

    // Inicializar la interfaz al cargar la página
    updateSelect();
    updateLeaderboard();
});
