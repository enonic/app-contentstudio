declare const CONFIG: {
    adminAssetsUri: string,
    adminUrl: string,
    allowScriptsInEditor: string,
    allowContentUpdate: string,
    appIconUrl: string,
    appId: string,
    appVersion: string,
    assetsUri: string,
    branch: string,
    launcher: {
        theme: string
    }
    launcherUrl: string,
    mainUrl: string
    stylesUrl: string,
    services: {
        contentUrl: string,
        i18nUrl: string,
        stylesUrl: string
    }
    theme: string
};

interface JQuery {
    simulate(event: string, ...data: any[]): JQuery;
}
