export async function importScript(url: string): Promise<void> {
    // TODO: Remove once target is es2022+
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            reject(new Error(`Failed to load script: ${url}`));
        };

        document.head.appendChild(script);
    });
}
