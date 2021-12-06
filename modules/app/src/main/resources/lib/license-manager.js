const subscriptionKey = "enonic.platform.subscription";
const licenseLib = require("/lib/license");

const getLicenseDetails = function (license) {
    const params = {
        appKey: subscriptionKey,
    };
    if (license) {
        params.license = license;
    }

    return licenseLib.validateLicense(params);
}

const isCurrentLicenseValid = function () {
    return isLicenseValid();
}

const isLicenseValid = function (license) {
    const licenseDetails = getLicenseDetails(license);

    return licenseDetails && !licenseDetails.expired;
}

exports.isCurrentLicenseValid = isCurrentLicenseValid;

exports.installLicense = function (license) {
    if (!isLicenseValid(license)) {
        return false;
    }

    licenseLib.installLicense({
        license: license,
        appKey: subscriptionKey,
    });

    return true;
}
