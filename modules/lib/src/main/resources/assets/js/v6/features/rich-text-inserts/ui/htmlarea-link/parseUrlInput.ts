export type UrlProtocol = 'https://' | 'http://' | 'ftp://' | 'tel:' | '';

export type UrlInputState = {
    urlValue: string;
    urlInputPrefix: string;
    urlProtocol: UrlProtocol;
};

export function detectProtocol(value: string): UrlProtocol {
    const lowerCaseValue = value.toLowerCase();
    if (lowerCaseValue.startsWith('tel:')) {
        return 'tel:';
    }
    if (lowerCaseValue.startsWith('https://')) {
        return 'https://';
    }
    if (lowerCaseValue.startsWith('http://')) {
        return 'http://';
    }
    if (lowerCaseValue.startsWith('ftp://')) {
        return 'ftp://';
    }
    return '';
}

export function parseUrlInput(prev: UrlInputState, raw: string, isPaste = false): UrlInputState {
    const value = raw.trimStart();
    let protocol = detectProtocol(value);
    let address = value.slice(protocol.length);

    if (isPaste) {
        // Strip every leading protocol on paste; the last supported one wins.
        address = address.trimStart();
        for (let next = detectProtocol(address); next; next = detectProtocol(address)) {
            protocol = next;
            address = address.slice(next.length).trimStart();
        }
    } else if (!prev.urlInputPrefix && protocol === detectProtocol(prev.urlValue.trimStart())) {
        // Typing may be editing an existing address such as tel:8080.
        protocol = '';
    }
    const isRelativePath = /^(?:[/?#]|\.{1,2}(?:[/?#]|$))/.test(value.trimEnd());

    return {
        urlValue: protocol ? address : raw,
        urlInputPrefix: protocol && !isPaste ? raw.slice(0, raw.length - value.length + protocol.length) : '',
        urlProtocol: protocol || (isRelativePath ? '' : prev.urlProtocol),
    };
}
