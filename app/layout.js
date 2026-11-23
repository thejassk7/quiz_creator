import "./globals.css";

export const metadata = {
  title: "Quiz Creator",
  description: "Create and manage quiz questions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
