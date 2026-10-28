/*global CKEDITOR*/

import { useEffect, useState } from 'react';
import { $config } from '../../config/config.store';

let loading: Promise<void> | undefined;

export const getCKEditorUrl = (assetsUri: string): string => `${assetsUri}/lib/ckeditor.js`;

export const isCKEditorLoaded = (): boolean => typeof CKEDITOR !== 'undefined';

export function loadCKEditor(assetsUri: string): Promise<void> {
    if (isCKEditorLoaded()) {
        return Promise.resolve();
    }

    loading ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = getCKEditorUrl(assetsUri);
        script.async = true;
        script.onload = () => {
            if (isCKEditorLoaded()) {
                applyDefaults();
                resolve();
            } else {
                reject(new Error(`${script.src} did not define CKEDITOR`));
            }
        };
        script.onerror = () => reject(new Error(`Failed to load ${script.src}`));
        document.head.appendChild(script);
    }).catch((error: unknown) => {
        loading = undefined;
        throw error;
    });

    return loading;
}

function applyDefaults(): void {
    const { locale } = $config.get();

    if (locale) {
        CKEDITOR.config.language = locale;
    }
}

export function useCKEditorLoaded(assetsUri: string): boolean {
    const [loaded, setLoaded] = useState(isCKEditorLoaded);

    useEffect(() => {
        if (loaded) {
            return;
        }

        let cancelled = false;

        loadCKEditor(assetsUri).then(
            () => {
                if (!cancelled) {
                    setLoaded(true);
                }
            },
            (error: unknown) => console.error(error),
        );

        return () => {
            cancelled = true;
        };
    }, [assetsUri, loaded]);

    return loaded;
}
