import { dictionary } from './translations/dictionary.js';
import { normalizeDescription } from './translation-normalizer.js';

// Implementación de Trie para búsqueda eficiente de palabras
class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.translation = null;
    }
}

class TranslationTrie {
    constructor() {
        this.root = new TrieNode();
        this.initialize();
    }

    initialize() {
        // Poblar el Trie con el diccionario
        Object.entries(dictionary).forEach(([english, spanish]) => {
            this.insert(english.toLowerCase(), spanish);
        });
    }

    insert(word, translation) {
        let node = this.root;
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        node.isEndOfWord = true;
        node.translation = translation;
    }

    findLongestMatch(text, startIndex) {
        let node = this.root;
        let lastMatch = null;
        let currentLength = 0;
        let i = startIndex;
        
        while (i < text.length) {
            const char = text[i].toLowerCase();
            if (!node.children.has(char)) break;
            
            node = node.children.get(char);
            currentLength++;
            
            if (node.isEndOfWord) {
                lastMatch = {
                    length: currentLength,
                    translation: node.translation
                };
            }
            
            i++;
        }
        
        return lastMatch;
    }
}

// Crear una única instancia del Trie
const translationTrie = new TranslationTrie();

// Cache para traducciones frecuentes
const translationCache = new Map();

// Función principal de traducción con caché
function translateSynopsis(text) {
    const normalizedText = normalizeDescription(text);
    if (!normalizedText) return '';
    
    // Verificar caché
    const cacheKey = normalizedText.toLowerCase();
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }
    
    // Traducir el texto
    let result = '';
    let i = 0;
    
    while (i < normalizedText.length) {
        // Buscar la coincidencia más larga desde la posición actual
        const match = translationTrie.findLongestMatch(normalizedText, i);
        
        if (match) {
            // Mantener la capitalización original
            let translation = match.translation;
            if (normalizedText[i] === normalizedText[i].toUpperCase()) {
                translation = translation.charAt(0).toUpperCase() + translation.slice(1);
            }
            result += translation;
            i += match.length;
        } else {
            // Mantener el carácter original si no hay coincidencia
            result += normalizedText[i];
            i++;
        }
    }
    
    // Almacenar en caché
    translationCache.set(cacheKey, result);
    
    return result;
}

// Función para limpiar la caché si es necesario
function clearTranslationCache() {
    translationCache.clear();
}

// Exportar las funciones necesarias
export { translateSynopsis, clearTranslationCache };

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.translateSynopsis = translateSynopsis;
    window.clearTranslationCache = clearTranslationCache;
} 
