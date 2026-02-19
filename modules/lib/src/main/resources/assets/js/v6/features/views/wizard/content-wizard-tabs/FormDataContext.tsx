import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {type ReadableAtom, type MapStore} from 'nanostores';
import {createContext, useContext} from 'react';

export type FormDataContextValue = {
    $draftData: ReadableAtom<PropertyTree | null>;
    $changedPaths: MapStore<Record<string, number>>;
    $validation: MapStore<Record<string, string[]>>;
    getDraftStringByPath: (path: PropertyPath) => string;
    setDraftStringByPath: (path: PropertyPath, value: string) => void;
    addOccurrence: (path: PropertyPath, occurrenceIndex: number) => void;
    removeOccurrence: (path: PropertyPath, occurrenceIndex: number) => void;
};

export const FormDataContext = createContext<FormDataContextValue | null>(null);

FormDataContext.displayName = 'FormDataContext';

export function useFormData(): FormDataContextValue {
    const context = useContext(FormDataContext);
    if (!context) {
        throw new Error('useFormData must be used within a FormDataContext.Provider');
    }
    return context;
}
