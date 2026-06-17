import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./net/socket"; // establish the socket connection on load

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
