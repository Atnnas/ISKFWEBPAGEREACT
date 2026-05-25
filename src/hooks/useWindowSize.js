import { useState, useEffect } from 'react';

const useWindowSize = () => {
    // Initialize with undefined to avoid hydration mismatch if using SSR (not the case here but good practice)
    // or just default to logical layout
    const [windowSize, setWindowSize] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        window.addEventListener('resize', handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

export default useWindowSize;
