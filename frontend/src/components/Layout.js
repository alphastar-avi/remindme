import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-tokyo-bg">
      <header className="nav-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-tokyo-blue to-tokyo-cyan rounded-2xl blur-lg opacity-30 animate-pulse-soft"></div>
                <div className="relative bg-gradient-to-r from-tokyo-blue to-tokyo-cyan p-2.5 rounded-2xl">
                  <Sparkles size={24} className="text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold gradient-text">RemindMe</h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-3 bg-tokyo-bgHighlight/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-tokyo-border/50">
                <div className="p-1.5 bg-gradient-to-r from-tokyo-green to-tokyo-teal rounded-full">
                  <User size={16} className="text-white" />
                </div>
                <span className="font-medium text-tokyo-fg">{user?.username}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 text-tokyo-fgDark hover:text-tokyo-red transition-all duration-300 p-2 hover:bg-tokyo-bgHighlight/50 rounded-xl"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
