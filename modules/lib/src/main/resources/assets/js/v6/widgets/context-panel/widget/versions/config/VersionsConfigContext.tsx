import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import { type VersionsConfig } from './VersionsConfig';

const VersionsConfigContext = createContext<VersionsConfig | null>(null);

type VersionsConfigProviderProps = {
    config: VersionsConfig;
    children?: ReactNode;
};

export const VersionsConfigProvider = ({ config, children }: VersionsConfigProviderProps): ReactElement => (
    <VersionsConfigContext.Provider value={config}>{children}</VersionsConfigContext.Provider>
);

VersionsConfigProvider.displayName = 'VersionsConfigProvider';

export const useVersionsConfig = (): VersionsConfig => {
    const config = useContext(VersionsConfigContext);
    if (!config) {
        throw new Error('useVersionsConfig must be used within a <VersionsConfigProvider>');
    }
    return config;
};
