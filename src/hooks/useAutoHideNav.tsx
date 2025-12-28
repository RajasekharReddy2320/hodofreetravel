import { useState, useEffect, useCallback } from "react";

export const useAutoHideNav = () => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY < 50) {
      setIsNavVisible(true);
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up
      setIsNavVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { isNavVisible };
};

export const useHoverRevealSidebar = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const isNearLeftEdge = e.clientX <= 60;
    setIsSidebarVisible(isNearLeftEdge || isHovering || isInteracting);
  }, [isHovering, isInteracting]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const sidebarProps = {
    onMouseEnter: () => {
      setIsHovering(true);
      setIsSidebarVisible(true);
    },
    onMouseLeave: () => {
      setIsHovering(false);
      if (!isInteracting) {
        setIsSidebarVisible(false);
      }
    },
    onFocus: () => setIsInteracting(true),
    onBlur: () => setIsInteracting(false),
  };

  return { isSidebarVisible, sidebarProps };
};
