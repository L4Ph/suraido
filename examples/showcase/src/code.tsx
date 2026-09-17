import type { Child } from "suraido.js";

/** A block of source, shown as it is written. No highlighter, and so no dependency. */
export function Code({ children }: { children?: Child }) {
  return (
    <pre class="code">
      <code>{children}</code>
    </pre>
  );
}
