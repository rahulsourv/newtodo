import React from 'react'

function Navbar() {
  return (
    <nav className='flex justify-between items-center px-10 py-3 bg-white/20 text-white backdrop-blur-xl border-b border-white/40 shadow-md sticky top-0 z-10'>
      <div className="logo text-2xl font-bold tracking-wide text-black">
        <span>TassKy</span>
      </div>
      <ul className='flex gap-10 text-lg text-black'>
        <li className='cursor-pointer hover:font-black transition font-semibold'>Home</li>
        <li className='cursor-pointer hover:font-black transition font-semibold'>About Task</li>
      </ul>
    </nav>
  )
}

export default Navbar