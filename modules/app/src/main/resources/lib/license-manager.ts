// @ts-expect-error No types for /lib/license yet.
import {installLicense as _installLicense, validateLicense} from "/lib/license";

interface InstallLicenseParams {
    appKey: string
    license: string
    publicKey?: string
}

const subscriptionKey = "enonic.platform.subscription";

const getLicenseDetails = function (license?: string) {
    const params: {
        appKey: string
        license?: string
    } = {
        appKey: subscriptionKey,
    };
    if (license) {
        params.license = license;
    }

    return validateLicense(params);
}

export const isCurrentLicenseValid = function () {
    return isLicenseValid();
}

const isLicenseValid = function (license?: string) {
    const licenseDetails = getLicenseDetails(license);

    return licenseDetails && !licenseDetails.expired;
}


export function installLicense(license: string) {
    if (!isLicenseValid(license)) {
        return false;
    }

    _installLicense({
        license: license,
        appKey: subscriptionKey,
    });

    return true;
}
