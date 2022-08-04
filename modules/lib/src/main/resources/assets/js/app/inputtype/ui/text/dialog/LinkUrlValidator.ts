import {FormInputEl} from "@enonic/lib-admin-ui/dom/FormInputEl";
import {i18n} from "@enonic/lib-admin-ui/util/Messages";

export class LinkUrlValidator {

    public static validUrl(input: FormInputEl): string | undefined {
        //http://<host>:<port>/<path>?<query>#<fragment>

        const protocol: RegExp = /^http(s)?:\/\//;
        const domain: RegExp = /((?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*(\.[A-Za-z]{2,6})?)+/;
        const port: RegExp = LinkUrlValidator.getPortRegExp();
        const path: RegExp = LinkUrlValidator.getPathRegExp();
        const endWithSlash: RegExp = /(\/)?/;
        const extension: RegExp = LinkUrlValidator.getExtensionRegExp();
        const query: RegExp = LinkUrlValidator.getQueryRegExp();
        const fragment: RegExp = LinkUrlValidator.getFragmentRegExp();

        const regex: RegExp = LinkUrlValidator.getRegexFromArray([
            protocol,
            domain,
            port,
            path,
            endWithSlash,
            extension,
            query,
            fragment
        ]);

        return LinkUrlValidator.stringContainsSingleBackslash(input.getValue()) || !LinkUrlValidator.isInputValueValid(regex, input)
               ? i18n('field.value.invalid')
               : undefined;
    }

    private static getRegexFromArray(regexes: RegExp[]): RegExp {
        return new RegExp(regexes.map((regex: RegExp): string => regex.source).join(''));
    }

    private static getPortRegExp(): RegExp {
        return /(:[0-9]+)?/;
    }

    private static getPathRegExp(): RegExp {
        return /((\/)+([A-z0-9\-\%\.]+\/)*[A-z0-9\-\%\.]*)?/;
    }

    private static getExtensionRegExp(): RegExp {
        return /(\.[A-z0-9\-\%]+)?/;
    }

    private static getQueryRegExp(): RegExp {
        return /(\?([^&=]+)=([^&=]*))?(?:&([^&=]+)=([^&=]*))*/;
    }

    private static getFragmentRegExp(): RegExp {
        return /(\#(\w|\?|\/|\:|\@|\-|\.|\_|\~|\!|\$|\&|\'|\(|\)|\*|\+|\,|\;|\=|(\%[0-9]{1,2}))+)*/;
    }

    private static isInputValueValid(regex: RegExp, input: FormInputEl): boolean {
        const matches: RegExpExecArray | null = regex.exec(input.getValue().trim());
        return Boolean(matches && matches[0] === matches?.input);
    }

    private static stringContainsSingleBackslash(string: string): boolean {
        return (String.raw`${string}`).indexOf('\\') >= 0;
    }
}
