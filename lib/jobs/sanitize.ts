import sanitizeHtml from "sanitize-html";

export function sanitizeJobDescription(description: string | null | undefined) {
  if (!description) return "";

  return sanitizeHtml(description, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "a"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer"
      })
    }
  });
}
