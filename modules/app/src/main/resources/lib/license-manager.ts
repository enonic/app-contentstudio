const subscriptionKey = "enonic.platform.subscription";
import type {ValidateLicenseParams} from "/lib/license";
import licenseLib from "/lib/license";

const getLicenseDetails = function (license?: string) {
    const params: ValidateLicenseParams = {
        appKey: subscriptionKey,
        license: license,
    };

    return licenseLib.validateLicense(params);
}

export function isLicenseValid(license?: string): boolean {
    const licenseDetails = getLicenseDetails(license);
    return licenseDetails && !licenseDetails.expired;
}

export function isCurrentLicenseValid(): boolean {
    return isLicenseValid();
}

exports.isCurrentLicenseValid = isCurrentLicenseValid;

export function installLicense(license: string): boolean {
    if (!isLicenseValid(license)) {
        return false;
    }

    licenseLib.installLicense({
        license: license,
        appKey: subscriptionKey,
    });

    return true;
}
