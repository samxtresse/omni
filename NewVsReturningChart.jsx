import "./globals.css";

export const metadata = {
  title: "Xtressé Omnichannel",
  description: "B2B + DTC unified analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
