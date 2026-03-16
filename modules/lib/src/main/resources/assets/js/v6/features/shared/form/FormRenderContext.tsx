import {type ReactElement, type ReactNode, createContext, useContext, useMemo} from 'react';

type FormRenderContextValue = {
    enabled: boolean;
};

const FormRenderContext = createContext<FormRenderContextValue | undefined>(undefined);

type FormRenderProviderProps = {
    enabled: boolean;
    children: ReactNode;
};

export const FormRenderProvider = ({enabled, children}: FormRenderProviderProps): ReactElement => {
    const value = useMemo(() => ({enabled}), [enabled]);

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
