import React, { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
    AnimatePresence,
    motion,
    useAnimation,
    useMotionValue,
    useTransform,
} from "framer-motion"
import { X } from "lucide-react"

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const IS_SERVER = typeof window === "undefined"

function useMediaQuery(query, defaultValue = false, initializeWithValue = true) {
    const getMatches = (query) => {
        if (IS_SERVER) {
            return defaultValue
        }
        return window.matchMedia(query).matches
    }

    const [matches, setMatches] = useState(() => {
        if (initializeWithValue) {
            return getMatches(query)
        }
        return defaultValue
    })

    const handleChange = () => {
        setMatches(getMatches(query))
    }

    useIsomorphicLayoutEffect(() => {
        const matchMedia = window.matchMedia(query)
        handleChange()

        matchMedia.addEventListener("change", handleChange)

        return () => {
            matchMedia.removeEventListener("change", handleChange)
        }
    }, [query])

    return matches
}

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1], filter: "blur(4px)" }
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] }

const Carousel = memo(
    ({
        handleClick,
        controls,
        cards,
        isCarouselActive,
    }) => {
        const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
        const cylinderWidth = isScreenSizeSm ? 1100 : 1800
        const faceCount = cards.length
        const faceWidth = cylinderWidth / faceCount
        const radius = cylinderWidth / (2 * Math.PI)
        const rotation = useMotionValue(0)
        const transform = useTransform(
            rotation,
            (value) => `rotate3d(0, 1, 0, ${value}deg)`
        )

        // Keyboard navigation
        useEffect(() => {
            const handleKeyDown = (e) => {
                if (!isCarouselActive) return;

                if (e.key === "ArrowLeft") {
                    controls.start({
                        rotateY: rotation.get() + (360 / faceCount),
                        transition: { type: "spring", stiffness: 100, damping: 30, mass: 0.1 }
                    });
                } else if (e.key === "ArrowRight") {
                    controls.start({
                        rotateY: rotation.get() - (360 / faceCount),
                        transition: { type: "spring", stiffness: 100, damping: 30, mass: 0.1 }
                    });
                }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [isCarouselActive, faceCount, controls, rotation]);

        return (
            <div
                className="flex h-full items-center justify-center"
                style={{
                    perspective: "1000px",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                <motion.div
                    drag={isCarouselActive ? "x" : false}
                    className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
                    style={{
                        transform,
                        rotateY: rotation,
                        width: cylinderWidth,
                        transformStyle: "preserve-3d",
                    }}
                    onDrag={(_, info) => {
                        if (isCarouselActive) {
                            // Reduced drag sensitivity for better control
                            rotation.set(rotation.get() + info.offset.x * 0.01);
                        }
                    }}
                    onDragEnd={(_, info) =>
                        isCarouselActive &&
                        controls.start({
                            rotateY: rotation.get() + info.velocity.x * 0.02,
                            transition: {
                                type: "spring",
                                stiffness: 100,
                                damping: 30,
                                mass: 0.1,
                            },
                        })
                    }
                    animate={controls}
                >
                    {cards.map((card, i) => (
                        <motion.div
                            key={`key-${card.img}-${i}`}
                            className="absolute flex flex-col h-full origin-center items-center justify-center rounded-xl p-2"
                            style={{
                                width: `${faceWidth}px`,
                                transform: `rotateY(${i * (360 / faceCount)
                                    }deg) translateZ(${radius}px)`,
                            }}
                            onClick={() => handleClick(card, i)}
                        >
                            <motion.div className="relative w-full aspect-square group">
                                <motion.img
                                    src={card.img}
                                    alt={card.title}
                                    layoutId={`img-${card.img}`}
                                    className="pointer-events-none w-full h-full rounded-xl object-cover shadow-2xl border border-white/10"
                                    initial={{ filter: "blur(4px)" }}
                                    layout="position"
                                    animate={{ filter: "blur(0px)" }}
                                    transition={transition}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col justify-end p-4">
                                    <p className="text-white text-[10px] uppercase font-bold tracking-widest leading-none">{card.title}</p>
                                </div>
                            </motion.div>
                            {/* Visible title below for aesthetic as requested */}
                            <div className="mt-4 text-center">
                                <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                    {card.title}
                                </p>
                                <div className="h-0.5 w-8 bg-iskf-red mx-auto mt-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        )
    }
)
Carousel.displayName = "Carousel"

function ThreeDPhotoCarousel({ items }) {
    const [activeCard, setActiveCard] = useState(null)
    const [isCarouselActive, setIsCarouselActive] = useState(true)
    const controls = useAnimation()

    const cards = useMemo(() => items || [], [items])

    const handleClick = (card) => {
        setActiveCard(card)
        setIsCarouselActive(false)
        controls.stop()
    }

    const handleClose = () => {
        setActiveCard(null)
        setIsCarouselActive(true)
    }

    return (
        <motion.div layout className="relative w-full">
            <AnimatePresence mode="sync">
                {activeCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-12 lg:p-24"
                        onClick={handleClose}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                        >
                            <X size={32} />
                        </button>

                        <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-8">
                            <motion.div
                                layoutId={`img-container-${activeCard.img}`}
                                className="relative w-full max-h-[70vh] flex items-center justify-center"
                            >
                                <motion.img
                                    layoutId={`img-${activeCard.img}`}
                                    src={activeCard.img}
                                    alt={activeCard.title}
                                    className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/20 object-contain"
                                    transition={transitionOverlay}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center space-y-4 max-w-2xl"
                            >
                                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                                    {activeCard.title}
                                </h3>
                                <div className="h-1.5 w-24 bg-iskf-red mx-auto rounded-full shadow-neon"></div>
                                <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed">
                                    {activeCard.desc}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative h-[500px] w-full overflow-hidden flex items-center justify-center">
                <Carousel
                    handleClick={handleClick}
                    controls={controls}
                    cards={cards}
                    isCarouselActive={isCarouselActive}
                />
            </div>
        </motion.div>
    )
}

export { ThreeDPhotoCarousel }
