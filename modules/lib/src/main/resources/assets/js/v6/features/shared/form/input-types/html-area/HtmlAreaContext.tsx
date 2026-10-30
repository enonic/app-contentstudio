import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { type ReactElement, type ReactNode, createContext, useContext, useMemo } from 'react';

type HtmlAreaContextValue = {
    applicationKeys: ApplicationKey[];
    assetsUri: string;
};

const HtmlAreaContext = createContext<HtmlAreaContextValue | undefined>(undefined);

type HtmlAreaProviderProps = HtmlAreaContextValue & {
    children: ReactNode;
};

export const HtmlAreaProvider = ({ applicationKeys, assetsUri, children }: HtmlAreaProviderProps): ReactElement => {
    const value = useMemo(() => ({ applicationKeys, assetsUri }), [applicationKeys, assetsUri]);

    return <HtmlAreaContext.Provider value={value}>{children}</HtmlAreaContext.Provider>;
};

HtmlAreaProvider.displayName = 'HtmlAreaProvider';

export const useHtmlAreaContext = (): HtmlAreaContextValue => {
    const context = useContext(HtmlAreaContext);

    if (context === undefined) {
        throw new Error('useHtmlAreaContext must be used within an HtmlAreaProvider');
    }

    return context;
};

export const useOptionalHtmlAreaContext = (): HtmlAreaContextValue | undefined => {
    return useContext(HtmlAreaContext);
};
