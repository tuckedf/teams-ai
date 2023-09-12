import * as React from "react";

export type AnchorRenderer = (
  displayText: string | undefined,
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
) => JSX.Element | null;

export const defaultAnchorRenderer: AnchorRenderer = (
  displayText: string | undefined,
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
): JSX.Element | null => {
  return React.createElement("a", props, displayText ?? props.href);
};
