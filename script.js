// Estado global
let currentType = 'movie';
let editingId = null;
let mediaList = JSON.parse(localStorage.getItem('mediaLibrary')) || [
    {
        id: '1',
        type: 'movie',
        title: "Matrix",
        url: "https://example.com/matrix",
        poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&w=300",
        description: "Un programador descubre un mundo misterioso de realidad digital.",
        rating: 5,
        date: new Date().toLocaleDateString()
    }
];

// Funciones de utilidad
function saveToStorage() {
    localStorage.setItem('mediaLibrary', JSON.stringify(mediaList));
}

function createSeasonHTML(seasonNumber, episodes = []) {
    return `
        <div class="season-container">
            <h3>Temporada ${seasonNumber}</h3>
            <div class="episodes-container">
                ${episodes.map((episode, index) => `
                    <div class="episode-container">
                        <p>Episodio ${index + 1}</p>
                        <input type="text" name="s${seasonNumber}e${index + 1}title" 
                               value="${episode?.title || ''}"
                               placeholder="Título del Episodio" required>
                        <input type="url" name="s${seasonNumber}e${index + 1}url" 
                               value="${episode?.url || ''}"
                               placeholder="URL del Episodio" required>
                    </div>
                `).join('')}
                <button type="button" class="add-episode-button" data-season="${seasonNumber}">
                    ➕ Agregar Episodio
                </button>
            </div>
        </div>
    `;
}

function createMediaCard(item) {
    return `
        <div class="media-card">
            <img src="${item.poster}" alt="${item.title}" class="media-poster">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="media-meta">
                <span>${"⭐".repeat(item.rating)}</span>
                <span>${item.date}</span>
            </div>
            ${item.type === 'movie' ? `
                <a href="${item.url}" target="_blank" class="play-button">
                    ▶️ Ver Película
                </a>
            ` : `
                <div class="seasons">
                    ${item.seasons.map(season => `
                        <details class="season-details">
                            <summary>Temporada ${season.number}</summary>
                            <div class="episodes">
                                ${season.episodes.map((episode, index) => `
                                    <div class="episode">
                                        <span>Episodio ${index + 1}: ${episode.title}</span>
                                        <a href="${episode.url}" target="_blank" class="episode-button">▶️</a>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    `).join('')}
                </div>
            `}
            <div class="action-buttons">
                <button onclick="handleEdit('${item.id}')" class="edit-button">
                    ✏️ Editar
                </button>
                <button onclick="handleDelete('${item.id}')" class="delete-button">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `;
}

// Funciones principales
function renderMedia(filter = '') {
    const grid = document.getElementById('mediaGrid');
    const filteredMedia = mediaList.filter(item => 
        item.type === currentType && 
        item.title.toLowerCase().includes(filter.toLowerCase())
    );
    
    grid.innerHTML = filteredMedia.map(item => createMediaCard(item)).join('');
}

function handleEdit(id) {
    const item = mediaList.find(m => m.id === id);
    if (!item) return;

    editingId = id;
    const form = document.getElementById('mediaForm');
    const modal = document.getElementById('addModal');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.textContent = `Editar ${item.type === 'movie' ? 'Película' : 'Serie'}`;
    
    // Llenar campos del formulario
    form.title.value = item.title;
    form.description.value = item.description;
    form.rating.value = item.rating;
    form.poster.value = item.poster;

    if (item.type === 'movie') {
        form.movieUrl.value = item.url;
        document.getElementById('movieFields').style.display = 'block';
        document.getElementById('seriesFields').style.display = 'none';
    } else {
        document.getElementById('movieFields').style.display = 'none';
        document.getElementById('seriesFields').style.display = 'block';
        const seasonsContainer = document.getElementById('seasonsContainer');
        seasonsContainer.innerHTML = item.seasons.map((season, index) => 
            createSeasonHTML(season.number, season.episodes)
        ).join('');
    }

    modal.style.display = 'block';
}

function handleDelete(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
        mediaList = mediaList.filter(item => item.id !== id);
        saveToStorage();
        renderMedia();
    }
}

function showModal() {
    const modal = document.getElementById('addModal');
    const movieFields = document.getElementById('movieFields');
    const seriesFields = document.getElementById('seriesFields');
    const modalTitle = document.getElementById('modalTitle');
    const seasonsContainer = document.getElementById('seasonsContainer');

    editingId = null;
    document.getElementById('mediaForm').reset();
    modalTitle.textContent = `Agregar Nueva ${currentType === 'movie' ? 'Película' : 'Serie'}`;
    
    movieFields.style.display = currentType === 'movie' ? 'block' : 'none';
    seriesFields.style.display = currentType === 'series' ? 'block' : 'none';

    if (currentType === 'series') {
        seasonsContainer.innerHTML = createSeasonHTML(1);
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('mediaForm').reset();
    editingId = null;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botones de tipo de medio
    document.querySelectorAll('.type-button').forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            if (type) {
                currentType = type;
                document.querySelectorAll('.type-button').forEach(b => 
                    b.classList.remove('active')
                );
                button.classList.add('active');
                renderMedia();
            }
        });
    });

    // Búsqueda
    document.querySelector('.search-input').addEventListener('input', (e) => {
        renderMedia(e.target.value);
    });

    // Botón agregar
    document.querySelector('.add-button').addEventListener('click', showModal);

    // Botón cerrar modal
    document.querySelector('.close-button').addEventListener('click', closeModal);
    document.querySelector('.cancel-button').addEventListener('click', closeModal);

    // Formulario
    document.getElementById('mediaForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const baseData = {
            id: editingId || Date.now().toString(),
            type: currentType,
            title: formData.get('title'),
            description: formData.get('description'),
            rating: parseInt(formData.get('rating')),
            poster: formData.get('poster'),
            date: new Date().toLocaleDateString()
        };

        let newItem;
        if (currentType === 'movie') {
            newItem = {
                ...baseData,
                url: formData.get('movieUrl')
            };
        } else {
            const seasons = [];
            const seasonContainers = document.querySelectorAll('.season-container');
            
            seasonContainers.forEach((container, seasonIndex) => {
                const episodes = [];
                const episodeContainers = container.querySelectorAll('.episode-container');
                
                episodeContainers.forEach((_, episodeIndex) => {
                    episodes.push({
                        title: formData.get(`s${seasonIndex + 1}e${episodeIndex + 1}title`),
                        url: formData.get(`s${seasonIndex + 1}e${episodeIndex + 1}url`)
                    });
                });

                seasons.push({
                    number: seasonIndex + 1,
                    episodes
                });
            });

            newItem = {
                ...baseData,
                seasons
            };
        }

        if (editingId) {
            mediaList = mediaList.map(item => 
                item.id === editingId ? newItem : item
            );
        } else {
            mediaList.push(newItem);
        }

        saveToStorage();
        renderMedia();
        closeModal();
    });

    // Agregar temporada
    document.querySelector('.add-season-button').addEventListener('click', () => {
        const seasonsContainer = document.getElementById('seasonsContainer');
        const seasonCount = seasonsContainer.children.length + 1;
        const seasonHTML = createSeasonHTML(seasonCount);
        seasonsContainer.insertAdjacentHTML('beforeend', seasonHTML);
    });

    // Delegación de eventos para agregar episodios
    document.getElementById('seasonsContainer').addEventListener('click', (e) => {
        if (e.target.classList.contains('add-episode-button')) {
            const seasonNumber = e.target.dataset.season;
            const episodesContainer = e.target.closest('.season-container')
                                             .querySelector('.episodes-container');
            const episodeCount = episodesContainer.querySelectorAll('.episode-container').length;
            
            const newEpisodeHTML = `
                <div class="episode-container">
                    <p>Episodio ${episodeCount + 1}</p>
                    <input type="text" name="s${seasonNumber}e${episodeCount + 1}title" 
                           placeholder="Título del Episodio" required>
                    <input type="url" name="s${seasonNumber}e${episodeCount + 1}url" 
                           placeholder="URL del Episodio" required>
                </div>
            `;
            
            episodesContainer.insertAdjacentHTML('beforeend', newEpisodeHTML);
        }
    });

    // Renderizar media inicial
    renderMedia();
});