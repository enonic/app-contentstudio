import type {Response} from '/types/';

import {getMultipartStream} from '/lib/xp/portal';
import {readText} from "/lib/xp/io";
import {installLicense, isCurrentLicenseValid} from "/lib/license-manager";


export function post(): Response {
    const licenseStream = getMultipartStream("license");
    const license = readText(licenseStream);
    const licenseInstalled = installLicense(license);

    if (licenseInstalled) {
        return {
            status: 200,
            contentType: "application/json",
            body: {
                licenseValid: true,
            },
        };
    } else {
        return {
            status: 500,
        };
    }
};

export function get(): Response {
    return {
        status: 200,
        contentType: "application/json",
        body: {
            hasValidLicense: isCurrentLicenseValid()
        }
    };
}
