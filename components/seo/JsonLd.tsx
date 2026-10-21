/**
 * Renders a structured-data block.
 *
 * The payload is built on the server from our own database values, never from
 * user input, and JSON.stringify output is escaped for the one character that
 * could otherwise close the script tag early.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
