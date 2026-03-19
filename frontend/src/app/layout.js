import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Blue Planet Solutions | AI Interview Hub</title>
        <meta name="description" content="Professional Global Hiring & AI Interview Platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-inter">
        {children}
      </body>
    </html>
  );
}
