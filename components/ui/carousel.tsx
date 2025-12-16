"use client"

import * as React from "react"
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  defaultIndex?: number
}

interface CarouselState {
  activeIndex: number
  slideCount: number
}

interface CarouselContextType {
  state: CarouselState
  goToSlide: (index: number) => void
  nextSlide: () => void
  prevSlide: () => void
  registerSlide: () => number
}

const CarouselContext = React.createContext<CarouselContextType | null>(null)

export function Carousel({ 
  children, 
  className, 
  defaultIndex = 0,
  ...props 
}: CarouselProps) {
  // Use a ref to track slide count to avoid re-renders
  const slideCountRef = React.useRef(0)
  
  // Initialize state once
  const [state, setState] = React.useState<CarouselState>({
    activeIndex: defaultIndex,
    slideCount: 0
  })
  
  // Register slide function - increments the ref and updates state once
  const registerSlide = React.useCallback(() => {
    const currentIndex = slideCountRef.current
    slideCountRef.current += 1
    
    // Only update state if it's different from what we have
    if (state.slideCount !== slideCountRef.current) {
      setState(prev => ({ ...prev, slideCount: slideCountRef.current }))
    }
    
    return currentIndex
  }, [])
  
  // Memoize these functions to prevent them from being recreated on each render
  const goToSlide = React.useCallback((index: number) => {
    setState(prev => {
      // Only update if the index is different
      if (prev.activeIndex === index) return prev
      return { ...prev, activeIndex: index }
    })
  }, [])
  
  const nextSlide = React.useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      activeIndex: (prev.activeIndex + 1) % Math.max(1, prev.slideCount)
    }))
  }, [])
  
  const prevSlide = React.useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      activeIndex: (prev.activeIndex - 1 + prev.slideCount) % Math.max(1, prev.slideCount)
    }))
  }, [])
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({ state, goToSlide, nextSlide, prevSlide, registerSlide }),
    [state, goToSlide, nextSlide, prevSlide, registerSlide]
  )
  
  return (
    <CarouselContext.Provider value={contextValue}>
      <div 
        className={cn("relative", className)} 
        role="region" 
        aria-roledescription="carousel" 
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(CarouselContext)
  
  if (!context) {
    throw new Error("CarouselContent must be used within a Carousel")
  }
  
  return (
    <div className="overflow-hidden relative">
      <div 
        className={cn("flex transition-transform duration-300 ease-in-out", className)}
        style={{ transform: `translateX(-${context.state.activeIndex * 100}%)` }}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

export function CarouselItem({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(CarouselContext)
  const indexRef = React.useRef<number | null>(null)
  
  if (!context) {
    throw new Error("CarouselItem must be used within a Carousel")
  }
  
  // Use useEffect to register the slide after mounting, not during render
  React.useEffect(() => {
    // Only register once
    if (indexRef.current === null) {
      indexRef.current = context.registerSlide()
    }
  }, [context]);
  
  return (
    <div 
      className={cn("flex-shrink-0 flex-grow-0 basis-full", className)}
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${(indexRef.current ?? 0) + 1}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const context = React.useContext(CarouselContext)
  
  if (!context) {
    throw new Error("CarouselPrevious must be used within a Carousel")
  }
  
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute left-4 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full",
        className
      )}
      onClick={() => context.prevSlide()}
      {...props}
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

export function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const context = React.useContext(CarouselContext)
  
  if (!context) {
    throw new Error("CarouselNext must be used within a Carousel")
  }
  
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute right-4 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full",
        className
      )}
      onClick={() => context.nextSlide()}
      {...props}
    >
      <ArrowRightIcon className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

// Add indicators component
export function CarouselIndicators({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(CarouselContext)
  
  if (!context) {
    throw new Error("CarouselIndicators must be used within a Carousel")
  }
  
  return (
    <div 
      className={cn(
        "absolute bottom-4 left-0 right-0 flex justify-center space-x-2",
        className
      )}
      {...props}
    >
      {Array.from({ length: context.state.slideCount }).map((_, index) => (
        <button
          key={index}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            context.state.activeIndex === index 
              ? "bg-white" 
              : "bg-white/50 hover:bg-white/75"
          )}
          onClick={() => context.goToSlide(index)}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  )
}

export function useCarousel() {
  const context = React.useContext(CarouselContext)
  
  if (!context) {
    throw new Error("useCarousel must be used within a Carousel")
  }
  
  return context
}