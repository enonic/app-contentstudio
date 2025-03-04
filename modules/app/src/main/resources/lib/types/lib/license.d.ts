declare global {
    interface XpLibraries {
        '/lib/license': typeof import('./license');
    }
}

export interface InstallLicenseParams {
    license: string;
    appKey: string;
    publicKey?: string;
}

export interface ValidateLicenseParams {
    appKey?: string;
    publicKey?: string;
    license?: string;
}

export interface LicenseDetails {
    expired: boolean;
    issuedTo: string;
    issuedBy: string;
    expiryTime: number;
    issueTime: number;
    data: Record<string, unknown>;
}

export interface License {
    installLicense: (params: InstallLicenseParams) => boolean;
    validateLicense: (params?: ValidateLicenseParams) => LicenseDetails;
}

declare const license: License;

export default license;
