import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures that whenever the user navigates to any page or route,
 * the viewport and all scrollable containers (window, document, and dashboard main elements)
 * are immediately scrolled to the very top.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If navigating to an in-page anchor hash, scroll to that target element
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // 1. Reset standard browser window scroll
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });

    // 2. Reset html & body elements
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Reset all overflow-y scroll containers (such as DashboardLayout main and aside)
    const scrollableContainers = document.querySelectorAll<HTMLElement>(
      'main, [class*="overflow-y-auto"], [class*="overflow-auto"], #root'
    );

    scrollableContainers.forEach((container) => {
      container.scrollTop = 0;
    });
  }, [pathname, search, hash]);

  return null;
}

