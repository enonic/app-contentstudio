// `react` for the bundle: preact/compat plus React APIs it lacks, which React libraries feature-detect at runtime.
// preact/compat is an ES module, so a namespace read of a missing export (`React.Activity`) fails the build.
export * from 'preact/compat';
export { default } from 'preact/compat';

// React 19.2+, https://github.com/preactjs/preact/issues/4977. Undefined tells libraries to take their fallback.
export const Activity = undefined;
