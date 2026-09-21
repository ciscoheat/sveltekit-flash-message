// @ts-check

/**
 * @typedef {Object} RemarkClipperOptions
 * @property {string} [wrapperTag]
 * @property {string | string[]} [wrapperClasses]
 * @property {string} [contentTag]
 * @property {string | string[]} [contentClasses]
 * @property {string} [markdownContentClass]
 */
const remarkClipperDefaultOptions = {
  wrapperTag: "div",
  wrapperClasses: "grid gap-2xl lg:grid-cols-2 lg:items-center",
  contentTag: "div",
  contentClasses: "",
  markdownContentClass: "markdown-content",
};

/**
 * Transform markdown sections using: <section ... column="first|last">...</section>
 * into a two-part structure where first/last creates a column for the respective markdown paragraph.
 *
 * Useful for implementing simple section and column layouts directly in markdown, like an image on left or right.
 * For more advanced use cases, consider using MDX.
 *
 * @param {RemarkClipperOptions} [userOptions]
 */
export function remarkClipper(userOptions = {}) {
  const options = {
    ...remarkClipperDefaultOptions,
    ...userOptions,
  };

  return function transformer(/** @type {any} */ tree) {
    transformNode(tree, options);
  };
}

/**
 * @param {{ children: any; }} node
 * @param {RemarkClipperOptions} options
 */
function transformNode(node, options) {
  if (!node || typeof node !== "object" || !Array.isArray(node.children)) {
    return;
  }

  for (const child of node.children) {
    transformNode(child, options);
  }

  rewriteChildren(node.children, options);
}

/**
 * @param {any[]} children
 * @param {RemarkClipperOptions} options
 */
function rewriteChildren(children, options) {
  const expanded = expandSplitTagNodes(children);
  if (expanded.length !== children.length || expanded.some((node, index) => node !== children[index])) {
    children.splice(0, children.length, ...expanded);
  }

  let index = 0;

  while (index < children.length) {
    const open = parseSectionOpen(children[index], options);

    if (!open) {
      index += 1;
      continue;
    }

    const closeIndex = findClosingIndex(
      children,
      index + 1,
      (/** @type {any} */ node) => Boolean(parseSectionOpen(node, options)),
      (/** @type {any} */ node) => parseHtmlCloseTag(node, "section"),
    );

    if (closeIndex < 0) {
      index += 1;
      continue;
    }

    const innerNodes = children.slice(index + 1, closeIndex);
    const replacement = buildSectionReplacement(open, innerNodes, options);

    if (replacement) {
      children.splice(index, closeIndex - index + 1, ...replacement);
      index += replacement.length;
      continue;
    }

    // No column attribute: keep content as-is but still apply markdownContentClass to the section
    const sectionProps = withMergedClasses(open.properties, options.markdownContentClass ?? "");
    children[index] = htmlNode(openTag("section", sectionProps));
    index = closeIndex + 1;
  }
}

/**
 * @param {{ tagName?: any; properties: any; }} sectionOpen
 * @param {any[]} sectionChildren
 * @param {RemarkClipperOptions} options
 */
function buildSectionReplacement(sectionOpen, sectionChildren, options) {
  const attrName = "column";
  const colValue = String(sectionOpen.properties?.[attrName] ?? "").toLowerCase();

  if (colValue !== "first" && colValue !== "last") {
    return null;
  }

  const content = sectionChildren.filter((/** @type {any} */ node) => !isIgnorable(node));
  const firstChild = content[0] || null;
  const lastChild = content.length > 0 ? content[content.length - 1] : null;
  const rest = colValue === "first" ? content.slice(1) : content.slice(0, content.length > 0 ? content.length - 1 : 0);

  const outerProps = withMergedClasses({}, options.wrapperClasses ?? "");
  const contentProps = withMergedClasses({}, options.contentClasses ?? "");
  const sectionProps = withMergedClasses(sectionOpen.properties, options.markdownContentClass ?? "");
  delete sectionProps[attrName];

  const wrapperTag = options.wrapperTag ?? "div";
  const contentTag = options.contentTag ?? "div";
  const nodes = [htmlNode(openTag("section", sectionProps)), htmlNode(openTag(wrapperTag, outerProps))];

  if (colValue === "first" && firstChild) {
    nodes.push(firstChild);
  }

  nodes.push(htmlNode(openTag(contentTag, contentProps)));
  nodes.push(...rest);
  nodes.push(htmlNode(closeTag(contentTag)));

  if (colValue === "last" && lastChild) {
    nodes.push(lastChild);
  }

  nodes.push(htmlNode(closeTag(wrapperTag)));
  nodes.push(htmlNode(closeTag("section")));

  return nodes;
}

/**
 * @param {any} node
 * @param {RemarkClipperOptions} options
 */
function parseSectionOpen(node, options) {
  const parsed = parseHtmlAnyOpenTag(node);

  if (!parsed || parsed.tagName !== "section") {
    return null;
  }

  return parsed;
}

/**
 * @param {{ type: string; value: any; }} node
 */
function splitHtmlTagNode(node) {
  if (node?.type !== "html" || typeof node.value !== "string") {
    return null;
  }

  const value = node.value;
  const tagRegex = /<!--[^]*?-->|<\/?[a-z0-9-]+(?:\s[^>]*)?>/gi;
  const matches = [...value.matchAll(tagRegex)];

  if (matches.length <= 1) {
    return null;
  }

  const onlyTagsAndWhitespace = value.replace(tagRegex, "").trim().length === 0;

  if (!onlyTagsAndWhitespace) {
    return null;
  }

  return matches.map((match) => htmlNode(match[0]));
}

/**
 * @param {any} nodes
 */
function expandSplitTagNodes(nodes) {
  const expanded = [];

  for (const node of nodes) {
    const split = splitHtmlTagNode(node);

    if (split) {
      expanded.push(...split);
    } else {
      expanded.push(node);
    }
  }

  return expanded;
}

/**
 * @param {{ type: string; value: string; }} node
 */
function parseHtmlAnyOpenTag(node) {
  if (node?.type !== "html" || typeof node.value !== "string") {
    return null;
  }

  const value = node.value.trim();
  const match = value.match(/^<\s*([a-z0-9-]+)([^>]*)>/i);

  if (!match || /^<\s*\//.test(value)) {
    return null;
  }

  return {
    tagName: match[1].toLowerCase(),
    properties: parseAttributes(match[2] || ""),
  };
}

/**
 * @param {{ type: string; value: string; }} node
 * @param {unknown} tagName
 */
function parseHtmlCloseTag(node, tagName) {
  if (node?.type !== "html" || typeof node.value !== "string") {
    return false;
  }

  const regex = new RegExp(`<\\s*\\/\\s*${escapeRegExp(tagName)}\\s*>`, "i");
  return regex.test(node.value);
}

/**
 * @param {string | any[]} nodes
 * @param {number} fromIndex
 * @param {{ (node: any): boolean; (arg0: any): any; }} isOpen
 * @param {{ (node: any): boolean; (arg0: any): any; }} isClose
 */
function findClosingIndex(nodes, fromIndex, isOpen, isClose) {
  let depth = 1;

  for (let index = fromIndex; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (isOpen(node)) {
      depth += 1;
      continue;
    }

    if (isClose(node)) {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

/**
 * @param {string} source
 * @returns {Record<string, any>}
 */
function parseAttributes(source) {
  /** @type {Record<string, any>} */
  const properties = {};
  const attributeRegex = /([:@a-zA-Z_][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let match = attributeRegex.exec(source);

  while (match) {
    const name = match[1];
    const rawValue = match[2];
    const value = normalizeAttributeValue(rawValue);

    if (name.toLowerCase() === "class" || name === "className") {
      properties.className = mergeClassNames(properties.className, toClassNameArray(value));
    } else {
      properties[name] = value;
    }

    match = attributeRegex.exec(source);
  }

  return properties;
}

/**
 * @param {string} rawValue
 */
function normalizeAttributeValue(rawValue) {
  if (!rawValue) {
    return "";
  }

  if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

/**
 * @param {Record<string, any>} properties
 * @param {string | string[]} extraClassNames
 * @returns {Record<string, any>}
 */
function withMergedClasses(properties, extraClassNames) {
  /** @type {Record<string, any>} */
  const next = { ...(properties || {}) };
  const merged = mergeClassNames(next["className"], toClassNameArray(extraClassNames));

  if (merged && merged.length > 0) {
    next["className"] = merged;
  }

  return next;
}

/**
 * @param {string} tagName
 * @param {Record<string, any> | undefined} properties
 * @returns {string}
 */
function openTag(tagName, properties) {
  const attrs = serializeAttributes(properties);
  return attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;
}

/**
 * @param {unknown} tagName
 */
function closeTag(tagName) {
  return `</${tagName}>`;
}

/**
 * @param {Record<string, any>} [properties]
 * @returns {string}
 */
function serializeAttributes(properties = {}) {
  return Object.entries(properties)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const htmlKey = key === "className" ? "class" : key;
      const normalizedValue = Array.isArray(value) ? value.join(" ") : String(value);

      if (normalizedValue === "") {
        return htmlKey;
      }

      return `${htmlKey}="${escapeHtmlAttribute(normalizedValue)}"`;
    })
    .join(" ");
}

/**
 * @param {string} value
 */
function escapeHtmlAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * @param {string} value
 */
function htmlNode(value) {
  return {
    type: "html",
    value,
  };
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function toClassNameArray(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(/\s+/)).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value).split(/\s+/).filter(Boolean);
}

/**
 * @param {string | string[] | undefined} existing
 * @param {string[]} extra
 * @returns {string[] | undefined}
 */
function mergeClassNames(existing, extra) {
  const merged = [...toClassNameArray(existing), ...toClassNameArray(extra)];

  if (merged.length === 0) {
    return undefined;
  }

  return Array.from(new Set(merged));
}

/**
 * @param {{ type: string; value: string; }} node
 */
function isIgnorable(node) {
  return node?.type === "html" && (!node.value || !node.value.trim());
}

/**
 * @param {unknown} value
 */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
