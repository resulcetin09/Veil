import { Buffer } from "buffer";
import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist";
import "./styles.css";
import App from "./App";

globalThis.Buffer = Buffer;

class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal">
          <h1>Let’s reconnect.</h1>
          <p>
            Veil could not load this session. Reload the page to clear temporary
            private data and start again.
          </p>
          <a className="button primary" href={window.location.pathname}>
            Reload Veil
          </a>
        </main>
      );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
