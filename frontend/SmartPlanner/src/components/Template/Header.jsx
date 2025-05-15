import { useState } from 'react';

export default function Header({ onMenuClick }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 h-16 sticky top-0 z-20 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button 
          className="material-icons-outlined text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-lg transition-colors duration-200"
          aria-label="Toggle menu"
          onClick={onMenuClick}
        >
          menu
        </button>
        
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Workplace ticket</h2>
          <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Main Table
          </span>
        </div>
      </div>

      {/* Center Search */}
      <div className={`flex-1 max-w-2xl mx-4 transition-all duration-200 ${searchFocused ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-500 pl-10"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <span className="material-icons-outlined absolute left-3 top-2 text-gray-400 text-lg">
            search
          </span>
          {searchFocused && (
            <span className="absolute right-3 top-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button 
          className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors duration-200"
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          aria-label="Notifications"
        >
          <span className="material-icons-outlined text-gray-600">notifications</span>
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <button 
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          aria-label="Help"
        >
          <span className="material-icons-outlined text-gray-600">help_outline</span>
        </button>

        <div className="relative">
          <button 
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg pl-1 pr-2 py-1 transition-colors duration-200"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-label="User menu"
          >
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User Avatar"
              className="w-8 h-8 rounded-full border-2 border-blue-500"
            />
            <span className="font-medium text-gray-700 text-sm">Juan Pérez</span>
            <span className={`material-icons-outlined text-gray-500 text-lg transition-transform duration-200 ${profileMenuOpen ? 'transform rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Juan Pérez</p>
                <p className="text-xs text-gray-500 truncate">juan.perez@example.com</p>
              </div>
              <div className="py-1">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">account_circle</span>
                  Profile
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">settings</span>
                  Settings
                </a>
              </div>
              <div className="py-1 border-t border-gray-100">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">logout</span>
                  Sign out
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-30 py-2">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            <button className="text-xs text-blue-600 hover:text-blue-800">Mark all as read</button>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {[1, 2, 3].map((item) => (
              <div key={item} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                    <span className="material-icons-outlined text-lg">assignment</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">New ticket assigned</p>
                    <p className="text-xs text-gray-500 mt-1">You have a new ticket #TKT-00{item}</p>
                    <p className="text-xs text-gray-400 mt-1">2{item} minutes ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <a href="#" className="text-xs text-blue-600 hover:text-blue-800">View all notifications</a>
          </div>
        </div>
      )}
    </header>
  );
}