import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {Message, MessageType} from '@enonic/lib-admin-ui/notify/Message';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

type Versions = Record<string, { applicationUrl: string; date: string }>;

export class VersionHelper {

    private static checkDelay = 5000; // Initiate the first check after 5 seconds
    private static checkInterval = 30000;   // Retry checks every checkInterval seconds
    private static checkAttempts = 5;       // for checkAttempts times

    static checkAndNotifyIfNewerVersionExists() {
        setTimeout(() => {
            AppHelper.executeWithRetry(
                VersionHelper.fetchNewerVersion,
                VersionHelper.checkInterval,
                VersionHelper.checkAttempts,
                (version: string) => !StringHelper.isBlank(version)
            )
                .then((newestVersion: string) => {
                    if (!StringHelper.isBlank(newestVersion)) {
                        const lastDismissedVersion = CONFIG.getString('lastDismissedVersion');
                        if (!lastDismissedVersion || VersionHelper.isVersionGreater(newestVersion, lastDismissedVersion)) {
                            VersionHelper.notifyAboutNewerVersion(newestVersion);
                        }
                    }
                })
                .catch(error => {
                    console.error('Version check failed:', error.message);
                });
        }, VersionHelper.checkDelay);
    }

    private static async fetchNewerVersion(): Promise<string | null> {
        const xpVersion = CONFIG.getString('xpVersion');
        const appVersion = CONFIG.getString('appVersion');
        const marketUrl = CONFIG.getString('marketUrl');
        const appId = CONFIG.getString('appId');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout in 10 seconds

            const response = await fetch(
                `${marketUrl}?xpVersion=${xpVersion}&start=0&count=-1`, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json;charset=UTF-8",
                    },
                    body: JSON.stringify({ids: [appId]}),
                    signal: controller.signal,
                });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`Failed response. Status: ${response.status}`);
                return null;
            }

            const responseAsJson = await response.json();
            if (!responseAsJson || !responseAsJson.hits || !responseAsJson.hits[appId]) {
                return null;
            }

            const latestVersion = responseAsJson.hits[appId].latestVersion;
            if (!StringHelper.isBlank(latestVersion) && VersionHelper.isVersionGreater(latestVersion, appVersion)) {
                return latestVersion;
            }

            return null;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timed out');
            } else {
                console.error('Error fetching application info from market:', error);
            }
            return null;
        }
    }

    private static isVersionGreater(version1: string, version2: string): boolean {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);

        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const v1 = v1Parts[i] || 0;
            const v2 = v2Parts[i] || 0;
            if (v1 > v2) {
                return true;
            } else if (v1 < v2) {
                return false;
            }
        }
        return false;
    }

    private static notifyAboutNewerVersion(version: string) {
        const message = new Message(MessageType.WARNING, i18n('notify.newerVersion', version), false);
        message.addAction(i18n('text.dismiss'), () => VersionHelper.dismissNotification(version));

        NotifyManager.get().notify(message);
    }

    private static dismissNotification(version: string) {
        const generalErrorMsg = i18n('notify.failedToDismiss');
        fetch(
            `${CONFIG.getString('services.dismissNotificationUrl')}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({version: version})
            })
        .then((response) => {
            if (!response.ok) {
                response.json().then((errorBody) => {
                    const errorMessage = errorBody?.error || 'Unknown error';
                    NotifyManager.get().showError(`${generalErrorMsg}: ${errorMessage}`);
                });
            }
        })
        .catch((error) => {
            NotifyManager.get().showError(generalErrorMsg);
        });
    }
}
