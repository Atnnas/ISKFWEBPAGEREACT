import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage from './components/pages/HomePage';
import EventDetailPage from './components/pages/EventDetailPage';
import AboutDetailPage from './components/pages/AboutDetailPage';
import KataListPage from './components/pages/KataListPage';
import KataDetailPage from './components/pages/KataDetailPage';
import ExamsPage from './components/pages/ExamsPage';

import Navbar from './components/layout/Navbar';
import SocialSidebar from './components/layout/SocialSidebar';
import BackToTop from './components/ui/BackToTop';

// ScrollToTop Component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll to top if we are NOT targeting a specific section via state
    // (This allows HomePage to handle its own specific scrolling)
    if (!window.history.state?.usr?.targetId) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

// Page Transition Wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2 }} // Fast simple fade-in only
    className="w-full"
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <SocialSidebar />
      <ScrollToTop />
      <BackToTop />
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/event/:id" element={<PageTransition><EventDetailPage /></PageTransition>} />
          <Route path="/about/:section" element={<PageTransition><AboutDetailPage /></PageTransition>} />
          <Route path="/resources/kata" element={<PageTransition><KataListPage /></PageTransition>} />
          <Route path="/resources/kata/:id" element={<PageTransition><KataDetailPage /></PageTransition>} />
          <Route path="/resources/exams" element={<PageTransition><ExamsPage /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
