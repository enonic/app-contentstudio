import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {Message, MessageType} from '@enonic/lib-admin-ui/notify/Message';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

interface MarketResponse {
    data?: {
        market: {
            queryDsl: {
                data: {
                    version: {
                        versionNumber: string;
                    }[]
                }
            }[]
        };
    };
    errors?: {
        errorType: string;
        message: string;
    }[];
}

export class VersionHelper {
    private static RELEASE_NOTES_URL = 'https://developer.enonic.com/docs/content-studio/stable/release';
    private static checkDelay = 5000; // Initiate the first check after 5 seconds
    private static checkInterval = 30000;   // Retry checks every checkInterval seconds
    private static checkAttempts = 5;       // for checkAttempts times

    static checkAndNotifyIfNewerVersionExists() {
        setTimeout(() => {
            AppHelper.executeWithRetry(
                VersionHelper.fetchNewerVersion,
                VersionHelper.checkInterval,
                VersionHelper.checkAttempts,
                (version: string) => ObjectHelper.isDefined(version)
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
        const appVersion = CONFIG.getString('appVersion');
        const marketApi = CONFIG.getString('marketApi');
        const appId = CONFIG.getString('appId');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout in 10 seconds

            const response = await fetch(
                `${marketApi}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json;charset=UTF-8"
                    },
                    body: JSON.stringify({query: VersionHelper.getGraphQLQuery(appId)}),
                    signal: controller.signal,
                });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`Failed response. Status: ${response.status}`);
                return null;
            }

            const responseAsJson: MarketResponse = await response.json();

            if (!responseAsJson?.data?.market?.queryDsl[0]?.data?.version) {
                return null;
            }

            const latestVersion = VersionHelper.findLatestVersion(responseAsJson.data.market.queryDsl[0].data.version);

            if (!StringHelper.isBlank(latestVersion) && VersionHelper.isMinorVersionGreater(latestVersion, appVersion)) {
                return latestVersion;
            }

            return '';
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timed out');
            } else {
                console.error('Error fetching application info from market:', error);
            }
            return null;
        }
    }

    private static findLatestVersion(versions: { versionNumber: string }[]): string {
        if (!versions || versions.length === 0) {
            return '';
        }

        let latestVersion = versions[0].versionNumber;

        for (const version of versions) {
            if (VersionHelper.isVersionGreater(version.versionNumber, latestVersion)) {
                latestVersion = version.versionNumber;
            }
        }

        return latestVersion;
    }

    private static compareVersions(newVersion: string, currentVersion: string, level: 'full' | 'minor'): boolean {
        const v1Parts = newVersion.split('.').map(Number);
        const v2Parts = currentVersion.split('.').map(Number);

        const maxParts = level === 'full' ? Math.max(v1Parts.length, v2Parts.length) : 2; // Compare full or up to minor
        for (let i = 0; i < maxParts; i++) {
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

    private static isVersionGreater(newVersion: string, currentVersion: string): boolean {
        return VersionHelper.compareVersions(newVersion, currentVersion, 'full');
    }

    private static isMinorVersionGreater(newVersion: string, currentVersion: string): boolean {
        return VersionHelper.compareVersions(newVersion, currentVersion, 'minor');
    }

    private static notifyAboutNewerVersion(version: string) {
        const message = Message.newInfo(i18n('notify.newerVersion', version), true, Message.longLifeTime);
        message.addAction(i18n('notify.newerVersion.link'), () => {
            window.open(VersionHelper.RELEASE_NOTES_URL, '_blank');
        });

        const messageId = NotifyManager.get().notify(message);
        NotifyManager.get().getNotification(messageId).onRemoved(() => VersionHelper.dismissNotification(version));
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

    private static getGraphQLQuery(appId: string): string {
        return `{
    market {
        queryDsl(query: {
            boolean: {
              must: [
                {
                  term: {
                    field: "type",
                    value: {
                      string: "com.enonic.app.market:application"
                    }
                  }
                },
                {
                  term: {
                    field: "data.identifier",
                    value: {
                      string: "${appId}"
                    }
                  }
                }
              ]
            }
          }) {
        ... on com_enonic_app_market_Application {
          data {
            version {
              versionNumber
            }
          }
        }
      }
    }
}`;
    }

}
