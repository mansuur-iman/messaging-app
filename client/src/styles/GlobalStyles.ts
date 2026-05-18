import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #FFFFFF;
    color: #1C1C1E;
    height: 100vh;
    overflow: hidden;
  }

  #root {
    height: 100vh;
    display: flex;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  input, textarea {
    font-family: inherit;
    outline: none;
    border: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;
