// Sistema de traducción optimizado con carga dinámica
class TranslationManager {
    constructor() {
        this.dictionaries = new Map();
        this.translationCache = new Map();
        this.loadedModules = new Set();
    }

    async loadDictionary(module) {
        if (this.loadedModules.has(module)) return;

        try {
            const dictionary = await import(`./core/${module}.js`);
            this.dictionaries.set(module, dictionary);
            this.loadedModules.add(module);
            console.log(`Diccionario ${module} cargado correctamente`);
        } catch (error) {
            console.error(`Error al cargar el diccionario ${module}:`, error);
        }
    }

    async initialize() {
        // Cargar diccionarios base
        await Promise.all([
            this.loadDictionary('common'),
            this.loadDictionary('verbs'),
            this.loadDictionary('adjectives')
        ]);
    }

    findTranslation(word) {
        word = word.toLowerCase();
        
        // Buscar en todos los diccionarios cargados
        for (const [_, dictionary] of this.dictionaries) {
            if (dictionary[word]) return dictionary[word];
        }
        
        return null;
    }

    async translateText(text) {
        if (!text) return '';

        // Verificar caché
        const cacheKey = text.toLowerCase();
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        // Dividir el texto en palabras
        const words = text.split(/(\s+|[.,!?;:()])/);
        let translatedText = '';

        for (const word of words) {
            if (!word.trim()) {
                translatedText += word;
                continue;
            }

            const translation = this.findTranslation(word);
            if (translation) {
                // Mantener la capitalización original
                if (word[0] === word[0].toUpperCase()) {
                    translatedText += translation.charAt(0).toUpperCase() + translation.slice(1);
                } else {
                    translatedText += translation;
                }
            } else {
                translatedText += word;
            }
        }

        // Guardar en caché
        this.translationCache.set(cacheKey, translatedText);
        return translatedText;
    }

    clearCache() {
        this.translationCache.clear();
    }
}

// Crear instancia única del gestor de traducciones
const translationManager = new TranslationManager();

// Función principal de traducción
import { normalizeDescription } from '../translation-normalizer.js';

async function translateSynopsis(text) {
    const normalizedText = normalizeDescription(text);
    if (!normalizedText) return '';
    // Asegurarse de que los diccionarios estén cargados
    await translationManager.initialize();
    return translationManager.translateText(normalizedText);
}

// Exportar funciones necesarias
export { translateSynopsis, translationManager };

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.translateSynopsis = translateSynopsis;
    window.translationManager = translationManager;
} 
