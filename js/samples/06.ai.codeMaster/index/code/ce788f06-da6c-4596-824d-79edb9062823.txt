import type { AllHTMLAttributes } from "./shared";
import { UUID } from "./shared";

export function addClass(
  props: { className?: string },
  ...classNames: string[]
) {
  const classList: string[] = props.className
    ? props.className.split(/\s+/g)
    : [];

  classList.push(...classNames);

  props.className = classList.join(" ");
}

export function createProps(): AllHTMLAttributes {
  return { style: {} };
}

export function isMobileOS(): boolean {
  /* eslint-disable-next-line no-restricted-globals */
  const userAgent = window.navigator.userAgent;

  return (
    !!userAgent.match(/Android/i) ||
    !!userAgent.match(/iPad/i) ||
    !!userAgent.match(/iPhone/i)
  );
}

/**
 * Generate a UUID prepended with "__ac-"
 */
export function generateUniqueId(): string {
  return `__ac-${UUID.generate()}`;
}

export function appendChild(node: Node, child: Node | undefined) {
  if (child) {
    node.appendChild(child);
  }
}

export function parseString(
  obj: any,
  defaultValue?: string
): string | undefined {
  return typeof obj === "string" ? obj : defaultValue;
}

export function parseNumber(
  obj: any,
  defaultValue?: number
): number | undefined {
  return typeof obj === "number" ? obj : defaultValue;
}

export function parseBool(
  value: any,
  defaultValue?: boolean
): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  } else if (typeof value === "string") {
    switch (value.toLowerCase()) {
      case "true":
        return true;
      case "false":
        return false;
      default:
        return defaultValue;
    }
  }

  return defaultValue;
}

function padStart(s: string, prefix: string, targetLength: number): string {
  let result = s;

  while (result.length < targetLength) {
    result = prefix + result;
  }

  return result;
}

export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = padStart((date.getMonth() + 1).toString(), "0", 2);
  const day = padStart(date.getDate().toString(), "0", 2);

  return `${year}-${month}-${day}`;
}

export function getEnumValueByName(
  enumType: { [s: number]: string },
  name: string
): number | undefined {
  // eslint-disable-next-line guard-for-in
  for (const key in enumType) {
    const keyAsNumber = parseInt(key, 10);

    if (keyAsNumber >= 0) {
      const value = enumType[key];

      if (
        value &&
        typeof value === "string" &&
        value.toLowerCase() === name.toLowerCase()
      ) {
        return keyAsNumber;
      }
    }
  }

  return undefined;
}

export function parseEnum(
  enumType: { [s: number]: string },
  name: string,
  defaultValue?: number
): number | undefined {
  if (!name) {
    return defaultValue;
  }

  const enumValue = getEnumValueByName(enumType, name);

  return enumValue !== undefined ? enumValue : defaultValue;
}

export function stringToCssColor(
  color: string | undefined
): string | undefined {
  if (color) {
    const regEx = /#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})?/gi;
    const matches = regEx.exec(color);

    if (matches && matches[4]) {
      const a = parseInt(matches[1], 16) / 255;
      const r = parseInt(matches[2], 16);
      const g = parseInt(matches[3], 16);
      const b = parseInt(matches[4], 16);

      return `rgba(${r},${g},${b},${a})`;
    }
  }

  return color;
}

export function clearElementChildren(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function addCancelSelectActionEventHandler(element: HTMLElement) {
  element.onclick = (e) => {
    e.preventDefault();
    e.cancelBubble = true;
  };
}
