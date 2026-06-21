const SUPABASE_URL = 'https://iguxoahcvzndnerqhzoz.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndXhvYWhjdnpuZG5lcnFoem96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODgxMTgsImV4cCI6MjA5NzU2NDExOH0.fEwCA7m3aKppysQfvYCAjmvXHK9K-0DydGHwTEEbSCU';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const addFriendForm = document.getElementById('add-friend-form');
    const friendNameInput = document.getElementById('friend-name');
    const logBeerForm = document.getElementById('log-beer-form');
    const selectFriend = document.getElementById('select-friend');
    const beerDate = document.getElementById('beer-date');
    const beerBrand = document.getElementById('beer-brand');
    const beerQty = document.getElementById('beer-qty');
    const leaderboard = document.getElementById('leaderboard');
    
    const btnAddFriend = document.getElementById('btn-add-friend');
    const btnLogBeer = document.getElementById('btn-log-beer');

    beerDate.valueAsDate = new Date();

    // Función principal: Trae los datos de la nube y actualiza la pantalla
    async function fetchAndRender() {
        // Pedimos los amigos y anidamos sus registros de cervezas automáticamente
        const { data: friends, error } = await _supabase
            .from('friends')
            .select('id, name, beer_logs(brand, qty)');

        if (error) {
            console.error('Error al obtener datos:', error);
            leaderboard.innerHTML = '<p class="empty-state" style="color: #ff4444;">Error al conectar con la base de datos.</p>';
            return;
        }

        updateSelect(friends);
        updateLeaderboard(friends);
    }

    // Actualiza el menú desplegable de selección de amigos
    function updateSelect(friends) {
        selectFriend.innerHTML = '<option value="" disabled selected>Selecciona un amigo...</option>';
        friends.forEach(friend => {
            const option = document.createElement('option');
            option.value = friend.id; // Guardamos el ID numérico de la base de datos
            option.textContent = friend.name;
            selectFriend.appendChild(option);
        });
    }

    // Procesa los datos y dibuja el Ranking en pantalla
    function updateLeaderboard(friends) {
        leaderboard.innerHTML = '';

        if (friends.length === 0) {
            leaderboard.innerHTML = '<p class="empty-state">Aún no hay amigos registrados. ¡Súmate!</p>';
            return;
        }

        // Mapeamos los datos para calcular totales y marcas favoritas en el frontend
        const processedFriends = friends.map(friend => {
            let totalBeers = 0;
            const brandCounts = {};
            let favoriteBrand = 'Ninguna';
            let maxCount = 0;

            friend.beer_logs.forEach(log => {
                totalBeers += log.qty;
                brandCounts[log.brand] = (brandCounts[log.brand] || 0) + log.qty;
                if (brandCounts[log.brand] > maxCount) {
                    maxCount = brandCounts[log.brand];
                    favoriteBrand = log.brand;
                }
            });

            return {
                name: friend.name,
                total: totalBeers,
                favoriteBrand: favoriteBrand
            };
        });

        // Ordenamos de mayor a menor consumo de cerveza
        processedFriends.sort((a, b) => b.total - a.total);

        // Renderizamos las tarjetas
        processedFriends.forEach(friend => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="friend-info">
                    <strong>${friend.name}</strong>
                    <div class="friend-stats">Favorita: ${friend.favoriteBrand}</div>
                </div>
                <div class="total-beers">${friend.total} 🍺</div>
            `;
            leaderboard.appendChild(item);
        });
    }

    // Evento: Agregar Amigo a Supabase
    addFriendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = friendNameInput.value.trim();
        if (!name) return;

        btnAddFriend.disabled = true;
        btnAddFriend.textContent = 'Guardando...';

        const { error } = await _supabase
            .from('friends')
            .insert([{ name: name }]);

        btnAddFriend.disabled = false;
        btnAddFriend.textContent = 'Anotar';

        if (error) {
            if (error.code === '23505') {
                alert('¡Ese nombre ya está registrado en el grupo!');
            } else {
                alert('Hubo un error al guardar el amigo.');
            }
        } else {
            friendNameInput.value = '';
            await fetchAndRender();
        }
    });

    // Evento: Registrar Cervezas a Supabase
    logBeerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const friendId = selectFriend.value;
        const date = beerDate.value;
        const brand = beerBrand.value.trim();
        const qty = parseInt(beerQty.value);

        if (!friendId || !date || !brand || qty <= 0) return;

        btnLogBeer.disabled = true;
        btnLogBeer.textContent = 'Enviando... ⏳';

        const { error } = await _supabase
            .from('beer_logs')
            .insert([{ 
                friend_id: friendId, 
                date: date, 
                brand: brand, 
                qty: qty 
            }]);

        btnLogBeer.disabled = false;
        btnLogBeer.textContent = '¡Salud! 🍺';

        if (error) {
            alert('Error al registrar la cerveza.');
            console.error(error);
        } else {
            beerBrand.value = '';
            beerQty.value = '';
            await fetchAndRender();
        }
    });

    // Carga inicial al abrir la página
    fetchAndRender();
});
