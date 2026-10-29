// Configuración de la API
const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE_URL}${path}`;
const baseUrl = API_BASE_URL;
const pageSize = 10;

// Prioridad de plataformas (de mayor a menor)
const platformPriority = {
    'PC': 1,
    'PlayStation': 2,
    'Xbox': 3,
    'Nintendo': 4,
    'Móvil': 5,
    'Otras': 6
};

const groupedPlatforms = {   
    'PC': [
        { id: 4, name: "PC" },
        { id: 5, name: "macOS" },
        { id: 6, name: "Linux" }
    ],
    'PlayStation': [ 
        { id: 187, name: "PlayStation 5" },
        { id: 18, name: "PlayStation 4" },
        { id: 16, name: "PlayStation 3" },
        { id: 15, name: "PlayStation 2" },
        { id: 27, name: "PlayStation" },
        { id: 19, name: "PS Vita" },
        { id: 17, name: "PSP" }
    ],
    'Xbox': [
        { id: 1, name: "Xbox One" },
        { id: 186, name: "Xbox Series S/X" },
        { id: 14, name: "Xbox 360" },
        { id: 80, name: "Xbox" }
    ],
    'Nintendo': [
        { id: 7, name: "Nintendo Switch" },
        { id: 8, name: "Nintendo 3DS" },
        { id: 9, name: "Nintendo DS" },
        { id: 13, name: "Nintendo DSi" },
        { id: 10, name: "Wii U" },
        { id: 11, name: "Wii" },
        { id: 105, name: "GameCube" },
        { id: 83, name: "Nintendo 64" },
        { id: 24, name: "Game Boy Advance" },
        { id: 43, name: "Game Boy Color" },
        { id: 26, name: "Game Boy" },
        { id: 79, name: "SNES" },
        { id: 49, name: "NES" }
    ],
    'Móvil': [
        { id: 3, name: "iOS" },
        { id: 21, name: "Android" }
    ],
    'Otras': [
        { id: 166, name: "Commodore / Amiga" },
        { id: 112, name: "Jaguar" },
        { id: 171, name: "Web" }
    ]
};

const genresES = {
    'action': 'Acción',
    'indie': 'Independientes',
    'adventure': 'Aventura',
    'role-playing-games-rpg': 'RPG o Juegos de Rol',
    'strategy': 'Estrategia',
    'shooter': 'Disparos',
    'casual': 'Casual',
    'simulation': 'Simulación',
    'puzzle': 'Puzle',
    'arcade': 'Arcade',
    'platformer': 'Plataformas',
    'racing': 'Carreras',
    'massively-multiplayer': 'Multijugador Masivo',
    'sports': 'Deportes',
    'fighting': 'Lucha',
    'family': 'Familiar',
    'board-games': 'Juegos de Mesa',
    'educational': 'Educativo',
    'card': 'Cartas'
};

// Cache para almacenar juegos ya mostrados
const juegosMostrados = new Set();

// Inicializar window.lastShownPlatform si no existe
if (typeof window !== 'undefined' && !window.lastShownPlatform) {
    window.lastShownPlatform = {};
}

// Función para determinar la plataforma principal de un juego
function getMainPlatform(game, currentPlatform) {
    console.log('Determinando plataforma principal para:', game.name, 'en plataforma:', currentPlatform);
    if (!game.platforms || game.platforms.length === 0) {
        console.log('Juego sin plataformas:', game.name);
        return null;
    }

    if (juegosMostrados.has(game.id)) {
        const shownPlatform = window.lastShownPlatform[game.id];
        if (platformPriority[shownPlatform] < platformPriority[currentPlatform]) {
            console.log('Juego ya mostrado en plataforma con mayor prioridad:', game.name);
            return null;
        }
    }

    const isAvailable = game.platforms.some(platform => 
        groupedPlatforms[currentPlatform].some(p => p.name === platform.platform.name)
    );

    if (isAvailable) {
        console.log(`Juego disponible en ${currentPlatform}:`, game.name);
        return currentPlatform;
    }

    console.log(`Juego no disponible en ${currentPlatform}:`, game.name);
    return null;
}

async function getGameDetails(gameId) {
    try {
        console.log('Obteniendo detalles para el juego:', gameId);
        const response = await fetch(apiUrl('/api/getGameDetails'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gameId })
        });
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud de detalles: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Detalles recibidos:', data);
        return data;
    } catch (error) {
        console.error(`Error al obtener detalles del juego ${gameId}:`, error);
        return null;
    }
}

async function getGenres() {
    try {
        console.log('Iniciando llamada a getGenres...');
        const response = await fetch(apiUrl('/api/getGenres'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Respuesta de getGenres:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error en getGenres:', errorText);
            throw new Error(`Error en la solicitud de géneros: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Datos de géneros recibidos:', data);
        return data.results || [];
    } catch (error) {
        console.error('Error en getGenres:', error);
        throw error;
    }
}

async function getGames(platformIds, genreId, page = 1, category, cursor = null) {
    try {
        console.log('Iniciando llamada a getGames con:', { platformIds, genreId, page });
        let nextCursor = cursor;
        let data;
        let continuationAttempts = 0;
        const collected = [];
        const collectedIds = new Set();

        do {
            const response = await fetch(apiUrl('/api/getGames'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ platformIds, genreId, page, category, cursor: nextCursor })
            });

            console.log('Respuesta de getGames:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en getGames:', errorText);
                throw new Error(`Error en la solicitud: ${response.status} - ${errorText}`);
            }

            data = await response.json();
            for (const game of Array.isArray(data.results) ? data.results : []) {
                if (!collectedIds.has(game.id)) {
                    collectedIds.add(game.id);
                    collected.push(game);
                }
            }

            if (data.partial && data.next && collected.length < pageSize && continuationAttempts < 4) {
                nextCursor = data.next;
                continuationAttempts += 1;
            } else {
                break;
            }
        } while (true);

        data.results = collected;
        console.log('Datos de juegos recibidos:', data);
        return data;
    } catch (error) {
        console.error('Error en getGames:', error);
        throw error;
    }
}

async function getPlataformas() {
    try {
        console.log('Obteniendo plataformas...');
        const response = await fetch(apiUrl('/api/getPlataformas'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud de plataformas: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Plataformas recibidas:', data);
        return data.results || [];
    } catch (error) {
        console.error('Error al obtener las plataformas:', error);
        return [];
    }
}

// Exportar todo lo necesario
export {
    baseUrl,
    pageSize,
    genresES,
    groupedPlatforms,
    platformPriority,
    getGameDetails,
    getGames,
    getGenres,
    getPlataformas,
    juegosMostrados,
    getMainPlatform
};

// Asegurarse de que las funciones están disponibles globalmente
window.getGameDetails = getGameDetails;
window.getGames = getGames;
window.getGenres = getGenres;
window.getPlataformas = getPlataformas;
window.getMainPlatform = getMainPlatform;
window.juegosMostrados = juegosMostrados;
window.groupedPlatforms = groupedPlatforms;
window.platformPriority = platformPriority;
window.genresES = genresES;
