export type AdminMenuOptions = {
    autoOpen?: boolean;
    hideButtonWhenOpen?: boolean;
};

export type AdminMenu = {
    mount(options?: AdminMenuOptions): Promise<HTMLElement>;
    unmount(): void;
};

type MenuWindow = Window & { XpMenu?: AdminMenu };

const loads = new WeakMap<Document, Promise<AdminMenu>>();

// A module fetch that failed stays failed in the document's module map, so a retry needs a url it has not seen.
const attempts = new WeakMap<Document, number>();

function loaderSrc(loaderUrl: string, doc: Document, attempt: number): string {
    const url = new URL(loaderUrl, doc.baseURI);
    if (attempt > 0) {
        url.searchParams.set('retry', String(attempt));
    }
    return url.href;
}

function presentMenu(doc: Document): AdminMenu | undefined {
    return (doc.defaultView as MenuWindow | null)?.XpMenu;
}

export function loadAdminMenu(loaderUrl: string, doc: Document = document): Promise<AdminMenu> {
    const present = presentMenu(doc);
    if (present) {
        return Promise.resolve(present);
    }

    let load = loads.get(doc);
    if (load === undefined) {
        const attempt = attempts.get(doc) ?? 0;
        load = new Promise<AdminMenu>((resolve, reject) => {
            const script = doc.createElement('script');
            script.type = 'module';
            script.dataset.autoMount = 'false';
            script.addEventListener('load', () => {
                const menu = presentMenu(doc);
                if (menu) {
                    resolve(menu);
                } else {
                    reject(new Error(`The menu loader at ${loaderUrl} left no XpMenu on the window`));
                }
            });
            script.addEventListener('error', () => {
                script.remove();
                reject(new Error(`The menu loader at ${loaderUrl} failed to load`));
            });
            script.src = loaderSrc(loaderUrl, doc, attempt);
            doc.head.appendChild(script);
        });
        loads.set(doc, load);
        load.catch(() => {
            loads.delete(doc);
            attempts.set(doc, attempt + 1);
        });
    }
    return load;
}

export function mountAdminMenu(
    loaderUrl: string,
    options?: AdminMenuOptions,
    doc: Document = document,
): Promise<HTMLElement> {
    return loadAdminMenu(loaderUrl, doc).then((menu) => menu.mount(options));
}
