export const metadata = { title: 'Cundina', description: 'Circle of Savings' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* <link rel="manifest" href="/manifest.json" /> */}
        <link rel="manifest" href="/pwa/manifest.json" /> 
        <link rel="icon" href="/pwa/favicon.ico" />
        <link rel="apple-touch-icon" href="/pwa/icon-192x192.png" /> 
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Helvetica', margin:0}}>
        <div style={{maxWidth:920, margin:'24px auto', padding:'0 16px'}}>
          <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h1 style={{margin:0}}>CUNDINA</h1>
            <nav style={{display:'flex', gap:12}}>
              <a href="/">Home</a>
              <a href="/dashboard">Dashboard</a>
            </nav>
          </header>
          {children}
          <footer style={{marginTop:48, fontSize:12, color:'#666'}}>
            © 2025 Cundina. All rights reserved. • Created to inspire shared growth.
          </footer>
        </div>
      </body>
    </html>
  );
}
