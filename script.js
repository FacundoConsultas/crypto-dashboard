const tableBody = document.getElementById('crypto-table-body');
const searchInput = document.getElementById('coin-search');
const searchBtn = document.getElementById('search-btn');
let myChart;

// 1. Obtener datos de la tabla (Top 15 en USD)
async function fetchMarketTable() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false');
        
        if (response.status === 429) {
            document.getElementById('selected-coin-name').innerText = "API Saturada. Espera 30s...";
            return;
        }

        const data = await response.json();
        renderTable(data);
    } catch (error) {
        console.error("Error al cargar la tabla:", error);
    }
}

function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach(coin => {
        const isUp = coin.price_change_percentage_24h >= 0;
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => loadCoinFullDetails(coin.id);

        row.innerHTML = `
            <td><strong>${coin.symbol.toUpperCase()}</strong></td>
            <td>$${coin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td class="${isUp ? 'price-up' : 'price-down'}">
                ${isUp ? '▲' : '▼'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 2. Cargar detalles de una moneda (USD)
async function loadCoinFullDetails(coinId) {
    try {
        const marketUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false`;
        const res = await fetch(marketUrl);
        const data = await res.json();

        if (data.length === 0) {
            alert("No se encontró la moneda. Usa el nombre en minúsculas (ej: 'solana').");
            return;
        }

        const coin = data[0];

        // Actualizar UI
        document.getElementById('selected-coin-name').innerText = `${coin.name} (${coin.symbol.toUpperCase()})`;
        document.getElementById('market-cap').innerText = `$${coin.market_cap.toLocaleString()}`;
        document.getElementById('volume').innerText = `$${coin.total_volume.toLocaleString()}`;
        document.getElementById('high-24h').innerText = `$${coin.high_24h.toLocaleString()}`;

        // Cargar gráfico histórico
        fetchChartData(coinId);
    } catch (error) {
        console.error("Error al cargar detalles:", error);
    }
}

// 3. Gráfico histórico de 7 días (USD)
async function fetchChartData(coinId) {
    try {
        const historyUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`;
        const response = await fetch(historyUrl);
        const data = await response.json();

        const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
        const prices = data.prices.map(p => p[1]);

        renderMainChart(labels, prices, coinId);
    } catch (error) {
        console.error("Error en el gráfico:", error);
    }
}

function renderMainChart(labels, prices, coinId) {
    const ctx = document.getElementById('myChart').getContext('2d');

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Precio USD',
                data: prices,
                borderColor: '#f0b90b',
                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#f0b90b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: '#848e9c' }, grid: { color: '#2b3139' } },
                x: { ticks: { color: '#848e9c' }, grid: { display: false } }
            }
        }
    });
}

// 4. Listeners para el buscador
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (query) loadCoinFullDetails(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.toLowerCase().trim();
        if (query) loadCoinFullDetails(query);
    }
});

// Inicio de la aplicación
fetchMarketTable();
loadCoinFullDetails('bitcoin');