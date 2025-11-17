// src/test-errors.js

// Catch global runtime errors
window.addEventListener("error", (event) => {
  console.error("❌ Runtime Error:", {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  });
});

// Catch unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Unhandled Promise Rejection:", event.reason);
});

// Utility: wrap functions to auto-log errors
export function safeRun(fn, label = "Function") {
  try {
    fn();
  } catch (err) {
    console.error(`❌ Error in ${label}:`, err);
  }
}
