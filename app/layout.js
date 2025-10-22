import './globals.css'

export const metadata = {
  title: 'GreenBankr',
  description: 'Sustainable Banking Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
