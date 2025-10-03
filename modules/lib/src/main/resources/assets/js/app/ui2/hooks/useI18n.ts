import {Messages} from "@enonic/lib-admin-ui/util/Messages";

//! Not fully implemented yet
export function useI18n(key: string, ...args: string[]): string {
    const phrase = Messages.hasMessage(key) ? Messages.getMessage(key) : `#${key}#`;
    return phrase.replace(/{(\d+)}/g, (_substring: string, ...replaceArgs: number[]) => args[replaceArgs[0]]).trim();
}
