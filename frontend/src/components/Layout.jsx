import React from 'react'
import { Sidebar } from './Sidebar'

export function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      <Sidebar />
      <main
        className="flex-1 ml-[260px] overflow-y-auto"
        style={{
          height: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  )
}

export default Layout
