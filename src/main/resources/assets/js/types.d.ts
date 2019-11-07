declare const CONFIG: {
    appId: string,
    xpVersion: string,
    branch: string,
    repository: string,
    adminUrl: string,
    launcherUrl: string,
    assetsUri: string,
    appIconUrl: string,
    adminAssetsUri: string,
    stylesUrl: string,
    messages: Array<any>
};

interface JQuery {
    simulate(event: string, ...data: any[]): JQuery;
}
