type AnyObject = Record<string | symbol | number, unknown>;

type EmptyObject = Record<never, never>;

type FnVoid = () => void;

type FnAny = (...args: unknown[]) => unknown;

//
// Optional
//
type Optional<T> = T | undefined | null;

//
// Utility types
//
type Identity<T> = {[P in keyof T]: T[P]};

type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

type Merge<T, U> = Identity<Omit<T, keyof U> & U>;

//
// DOM Extensions
//

// focusVisible is supported in Firefox 104+ and Safari 18.4+
// Chrome does not support focusVisible yet, but shows focus in situation more reliably.
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#focusvisible
interface FocusOptions {
    focusVisible?: boolean;
}

//
// JQuery
//
interface JQuery {
    simulate(event: string, ...data: any[]): JQuery;
}
