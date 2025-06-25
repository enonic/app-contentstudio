import {createContext, useContext} from 'react';
import type {ContentRowContextValue} from './types';

export const ContentRowContext = createContext<ContentRowContextValue | null>(null);

export const useContentRow = (): ContentRowContextValue => {
    const context = useContext(ContentRowContext);
    if (!context) {
        throw new Error('ContentRow.* components must be used within a ContentRow');
    }
    return context;
};
