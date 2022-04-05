import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';

export interface NonstandardCodes {
    [key: string]: string;
}

export interface FlagData {
    code: string;
    classCode: string;
}

export class Flag
    extends DivEl {

    private static CODE_NONE: string = 'none';

    private static CODE_UNKNOWN: string = 'unknown';

    private static NONSTANDARD_CODES: NonstandardCodes = Object.freeze({
        'ast-es': 'es',
        'af-na': 'na',
        'af-za': 'za',
        'an-as': 'ws',
        'bm-ml': 'ml',
        'ca-ad': 'ad',
        'cy-gb': 'gb',
        'da-gl': 'gl',
        'de-at': 'at',
        'de-be': 'be',
        'de-ch': 'ch',
        'de-lu': 'lu',
        'en-au': 'au',
        'en-bm': 'bm',
        'en-bb': 'bb',
        'en-bs': 'bs',
        'en-bw': 'bw',
        'en-cm': 'cm',
        'en-ca': 'ca',
        'en-us': 'us',
        'mgh-mz': 'mz',
        agq: Flag.CODE_NONE,
        asa: Flag.CODE_NONE,
        ast: Flag.CODE_NONE,
        bas: Flag.CODE_NONE,
        bem: 'za',
        bez: Flag.CODE_NONE,
        brx: Flag.CODE_NONE,
        ccp: Flag.CODE_NONE,
        cgg: Flag.CODE_NONE,
        chr: Flag.CODE_NONE,
        ckb: Flag.CODE_NONE,
        dav: Flag.CODE_NONE,
        dje: Flag.CODE_NONE,
        fil: 'ph',
        gsw: 'sw',
        kea: Flag.CODE_NONE,
        khq: Flag.CODE_NONE,
        kok: Flag.CODE_NONE,
        lag: Flag.CODE_NONE,
        lkt: Flag.CODE_NONE,
        lrc: Flag.CODE_NONE,
        luo: Flag.CODE_NONE,
        luy: Flag.CODE_NONE,
        mas: Flag.CODE_NONE,
        mer: Flag.CODE_NONE,
        mfe: 'mu',
        mgh: Flag.CODE_NONE,
        mua: Flag.CODE_NONE,
        mzn: Flag.CODE_NONE,
        nus: Flag.CODE_NONE,
        prg: Flag.CODE_NONE,
        rof: Flag.CODE_NONE,
        rwk: Flag.CODE_NONE,
        sah: Flag.CODE_NONE,
        saq: Flag.CODE_NONE,
        sbp: Flag.CODE_NONE,
        shi: Flag.CODE_NONE,
        smn: Flag.CODE_NONE,
        twq: Flag.CODE_NONE,
        tzm: Flag.CODE_NONE,
        vai: Flag.CODE_NONE,
        af: Flag.CODE_NONE,
        be: 'by',
        bm: Flag.CODE_NONE,
        br: 'fr',
        bs: Flag.CODE_NONE,
        ca: Flag.CODE_NONE,
        cs: 'cz',
        cu: Flag.CODE_NONE,
        cy: 'gb-wls',
        da: 'dk',
        ee: Flag.CODE_NONE,
        el: 'gr',
        en: 'gb',
        et: 'ee',
        eu: Flag.CODE_NONE,
        ga: 'ie',
        gd: 'gb-sct',
        gl: Flag.CODE_NONE,
        he: 'il',
        hi: 'in',
        ja: 'jp',
        ki: Flag.CODE_NONE,
        kw: Flag.CODE_NONE,
        ko: 'kr',
        ma: 'ms',
        om: Flag.CODE_NONE,
        se: Flag.CODE_NONE,
        sg: 'cf',
        sq: 'al',
        sr: 'rs',
        sv: 'se',
        uk: 'ua',
        zh: 'cn'
    });

    private countryCode: string;

    constructor(countryCode: string, className: string = '') {
        super('fi fis flag');
        if (!StringHelper.isEmpty(className)) {
            this.addClass(className);
        }
        this.updateCountryCode(countryCode);
    }

    updateCountryCode(countryCode: string) {
        const oldCountryCode = this.countryCode || '';
        const codeData = this.mapCode((countryCode || ''));
        const oldCodeData = this.mapCode(oldCountryCode);
        const countryClass = Flag.createCountryClass(codeData.classCode);
        const oldCountryClass = Flag.createCountryClass(oldCodeData.classCode);
        this.updateDataAttribute(codeData.code);
        this.removeClass(oldCountryClass);
        this.addClass(countryClass);
        this.countryCode = countryCode || '';
    }

    private updateDataAttribute(code?: string) {
        const hasCode = !StringHelper.isEmpty(code);
        if (hasCode) {
            this.getEl().setAttribute('data-code', code);
        } else {
            this.getEl().removeAttribute('data-code');
        }
    }

    protected static createCountryClass(code: string): string {
        return `fi-${code || Flag.CODE_UNKNOWN}`;
    }

    protected mapCode(countryCode: string): FlagData {
        const codeMap = this.getCodeMap();
        const fullCode = countryCode.toLowerCase();
        const longCode = fullCode.slice(0, 3);
        const shortCode = fullCode.slice(0, 2);

        const classCode = codeMap[fullCode] || codeMap[longCode] || codeMap[shortCode] || shortCode;
        const code = (this.hasNoFlag(classCode) || !this.isShortCode(classCode)) ? shortCode : classCode;

        return {code, classCode};
    }

    protected hasNoFlag(classCode: string): boolean {
        return classCode === Flag.CODE_NONE;
    }

    protected isShortCode(classCode: string): boolean {
        return classCode.length === 2 || classCode.length === 1;
    }

    protected getCodeMap(): NonstandardCodes {
        return Flag.NONSTANDARD_CODES;
    }
}
