const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
    copy: '©',
    reg: '®',
    trade: '™',
    hellip: '…',
    ndash: '–',
    mdash: '—',
    lsquo: '‘',
    rsquo: '’',
    ldquo: '“',
    rdquo: '”'
};

function decodeHtmlEntities(value) {
    let decoded = String(value ?? '');
    for (let pass = 0; pass < 2; pass += 1) {
        decoded = decoded.replace(/&(#x?[\da-f]+|[a-z][\da-z]+);/gi, (entity, code) => {
            if (code[0] === '#') {
                const hexadecimal = code[1].toLowerCase() === 'x';
                const number = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
                return Number.isNaN(number) ? entity : String.fromCodePoint(number);
            }
            return namedEntities[code.toLowerCase()] ?? entity;
        });
    }
    return decoded;
}

function normalizeDescription(value) {
    const withoutUnsafeBlocks = String(value ?? '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
    const withReadableBreaks = withoutUnsafeBlocks
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, '\n');

    return decodeHtmlEntities(withReadableBreaks)
        .replace(/<[^>]*>/g, ' ')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export { decodeHtmlEntities, normalizeDescription };

if (typeof window !== 'undefined') {
    window.decodeHtmlEntities = decodeHtmlEntities;
    window.normalizeDescription = normalizeDescription;
}
