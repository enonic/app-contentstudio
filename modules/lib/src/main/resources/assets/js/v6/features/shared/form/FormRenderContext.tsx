import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type ReactElement, type ReactNode, createContext, useContext, useMemo} from 'react';

type FormRenderContextValue = {
    enabled: boolean;
    applicationKey?: ApplicationKey;
};

const FormRenderContext = createContext<FormRenderContextValue | undefined>(undefined);

type FormRenderProviderProps = {
    enabled: boolean;
    applicationKey?: ApplicationKey;
    children: ReactNode;
};

export const FormRenderProvider = ({enabled, applicationKey, children}: FormRenderProviderProps): ReactElement => {
    const value = useMemo(() => ({enabled, applicationKey}), [enabled, applicationKey]);

    return (
        <FormRenderContext.Provider value={value}>
            {children}
        </FormRenderContext.Provider>
    );
};

FormRenderProvider.displayName = 'FormRenderProvider';

export const useFormRender = (): FormRenderContextValue => {
    const context = useContext(FormRenderContext);

    if (context === undefined) {
        throw new Error('useFormRender must be used within a FormRenderProvider');
    }

    return context;
};
