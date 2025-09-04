import React, { useRef, useEffect, ReactNode } from 'react';

interface FullscreenWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  onEnter?: () => void;
  onExit?: () => void;
}

export const FullscreenWrapper: React.FC<FullscreenWrapperProps> = ({
  children,
  onEnter,
  onExit,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const enterFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    else if ((el as any).mozRequestFullScreen) (el as any).mozRequestFullScreen();
    else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();

    onEnter?.();
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    else if ((document as any).mozCancelFullScreen) (document as any).mozCancelFullScreen();
    else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();

    onExit?.();
  };

  // Attach click listeners to nested buttons inside children
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const enterButtons = container.querySelectorAll('[data-action="enter"]');
    const exitButtons = container.querySelectorAll('[data-action="exit"]');
    const toggleButtons = container.querySelectorAll('[data-action="toggle"]');

    const handleEnter = (e: Event) => {
      e.stopPropagation();
      enterFullscreen();
    };

    const handleExit = (e: Event) => {
      e.stopPropagation();
      exitFullscreen();
    };

    const handleToggle = (e: Event) => {
      e.stopPropagation();
      if (document.fullscreenElement) {
        exitFullscreen();
      } else {
        enterFullscreen();
      }
    };

    enterButtons.forEach((btn) => btn.addEventListener('click', handleEnter));
    exitButtons.forEach((btn) => btn.addEventListener('click', handleExit));
    toggleButtons.forEach((btn) => btn.addEventListener('click', handleToggle));

    return () => {
      enterButtons.forEach((btn) =>
        btn.removeEventListener('click', handleEnter)
      );
      exitButtons.forEach((btn) =>
        btn.removeEventListener('click', handleExit)
      );
      toggleButtons.forEach((btn) =>
        btn.removeEventListener('click', handleToggle)
      );
    };
  }, []);

  // Listen for external fullscreen exit (ESC or browser)
  useEffect(() => {
    const handleChange = () => {
      const el = containerRef.current;
      const isFullscreen =
        document.fullscreenElement === el ||
        (document as any).webkitFullscreenElement === el ||
        (document as any).mozFullScreenElement === el ||
        (document as any).msFullscreenElement === el;

      if (!isFullscreen) {
        onExit?.();
      }
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);
    document.addEventListener('MSFullscreenChange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('MSFullscreenChange', handleChange);
    };
  }, [onExit]);

  return (
    <div className="fullscreen-wrapper" ref={containerRef} {...rest}>
      {children}
    </div>
  );
};

export default FullscreenWrapper;
