import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {Message, MessageType} from '@enonic/lib-admin-ui/notify/Message';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

type Versions = Record<string, { applicationUrl: string; date: string }>;

export class VersionHelper {

    private static checkDelay = 5000; // Initiate the first check after 5 seconds
    private static checkInterval = 30000; // Retry checks every 30 seconds
    private static checkAttempts = 5; // Retry checks every 30 seconds

    static checkAndNotifyIfNewerVersionExists() {

        setTimeout(() => {
            VersionHelper.executeWithRetry(VersionHelper.fetchNewerVersion, VersionHelper.checkInterval, (version: string) => !!version)
                .then((version: string) => {
                    if (version.trim()) {
                        VersionHelper.notifyAboutNewerVersion(version);
                    }
                })
                .catch(error => {
                    console.error('Version check failed:', error.message);
                });
        }, VersionHelper.checkDelay);
    }

    private static async fetchNewerVersion(): Promise<string> {
        const appVersion = CONFIG.getString('appVersion');
        const marketUrl = CONFIG.getString('marketUrl');
        //const xpVersion = CONFIG.getString('xpVersion');
        const xpVersion = "7.15.0";
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
                return;
            }

            const responseAsJson = await response.json();
            if (!responseAsJson || !responseAsJson.hits || !responseAsJson.hits[appId]) {
                return ' ';
            }

            return VersionHelper.findNextGreaterVersion(responseAsJson.hits[appId].versions, appVersion) || ' ';
            //return VersionHelper.findNextGreaterVersion(responseAsJson.hits[appId].versions, "5.0.0") || ' ';
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timed out');
            } else {
                console.error('Error fetching application info from market:', error);
            }
            return;
        }
    }

    private static executeWithRetry<T>(
        task: () => Promise<T>,
        intervalMs: number,
        stopCondition: (result: T) => boolean,
        maxAttempts: number = VersionHelper.checkAttempts
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            let hasStopped = false;

            const cleanupAndStop = (interval?: number, reason?: Error) => {
                if (hasStopped) {
                    return;
                }
                hasStopped = true;
                if (interval) {
                    clearInterval(interval);
                }
                if (reason) {
                    reject(reason);
                }
            };

            const executeTask = async () => {
                if (hasStopped) {
                    return false;
                }
                attempts++;
                if (attempts > maxAttempts) {
                    cleanupAndStop(undefined, new Error(`Max attempts (${maxAttempts}) reached without success.`));
                    return false;
                }

                try {
                    const result = await task();
                    if (stopCondition(result)) {
                        cleanupAndStop();
                        resolve(result);
                        return true;
                    }
                } catch (error) {
                    console.error(`Error on attempt ${attempts}:`, error);
                }
                return false;
            };

            executeTask().then((shouldStop: boolean) => {
                if (shouldStop) {
                    return;
                }

                // Set up periodic retries
                const interval = setInterval(async () => {
                    const shouldStopFurther = await executeTask();
                    if (shouldStopFurther) {
                        cleanupAndStop(interval);
                    }
                    if (attempts >= maxAttempts) {
                        cleanupAndStop(interval, new Error(`Max attempts (${maxAttempts}) reached without success.`));
                    }
                }, intervalMs);
            });
        });
    }

    private static findNextGreaterVersion(versionsObject: Versions, currentVersion: string): string | null {
        const versionKeys = Object.keys(versionsObject);

        // Filter versions greater than providedVersion
        const higherVersions = versionKeys.filter(version =>
            VersionHelper.isVersionGreater(version, currentVersion)
        );

        if (higherVersions.length === 0) {
            return null;
        }

        // Sort in descending order and return the highest
        higherVersions.sort((a, b) => VersionHelper.isVersionGreater(b, a) ? 1 : -1);

        return higherVersions[0];
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
        message.addAction(i18n('text.dismiss'), () => VersionHelper.dismissVersion(version));

        NotifyManager.get().notify(message);
    }

    private static dismissVersion(version: string) {
        console.log('Dismiss clicked: ' + version);
    }
}
