@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 250 250 250;
  --foreground: 10 10 10;
}

body {
  background: rgb(var(--background));
  color: rgb(var(--foreground));
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Recharts polish */
.recharts-cartesian-axis-tick-value {
  font-size: 11px;
  fill: #64748b;
}

.recharts-tooltip-wrapper {
  outline: none;
}
