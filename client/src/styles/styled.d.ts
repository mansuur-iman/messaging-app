import type { Theme } from "./theme";

declare module "styled-components" {
  // Use an interface instead of a type alias so TypeScript can merge them
  export interface DefaultTheme extends Theme {}
}
