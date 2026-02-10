"use client";

import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRef } from "react";
import Image from "next/image";

const gradients = [
  "bg-gradient-to-r from-blue-500 to-cyan-500",
  "bg-gradient-to-r from-purple-500 to-pink-500",
  "bg-gradient-to-r from-orange-400 to-red-500",
  "bg-gradient-to-r from-emerald-500 to-teal-500",
];

interface CarouselImage {
  src: string;
  text: string;
}

interface HomeCarouselProps {
  images?: CarouselImage[];
}

export function HomeCarousel({ images = [] }: HomeCarouselProps) {
  const plugin = useRef(
    Autoplay({ delay: 10000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  // Fallback if no images provided
  const displayImages = images.length > 0 ? images : [
    { src: "/placeholder", text: "尚無活動照片" }
  ];

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center relative group">
      <Carousel
        plugins={[plugin.current]}
        opts={{ loop: true }}
        className="w-full h-full"
      >
        <CarouselContent className="h-full">
          {displayImages.map((item, index) => (
            <CarouselItem key={index} className="h-full">
              <div className="flex flex-col h-full w-full">
                {/* Top: Text Section (Smaller) */}
                <div className={`w-full h-[20%] ${gradients[index % gradients.length]} flex flex-col items-center justify-center text-white p-4 text-center`}>
                   <h3 className="text-lg md:text-xl font-bold tracking-wider drop-shadow-md line-clamp-2">
                     {item.text}
                   </h3>
                </div>
                
                {/* Bottom: Image Section (16:9 container or Flex fill) */}
                <div className="w-full h-[80%] relative bg-slate-800 flex items-center justify-center overflow-hidden">
                   <Image 
                     src={item.src} 
                     alt={item.text} 
                     fill 
                     sizes="(max-width: 768px) 100vw, 50vw"
                     className="object-cover object-center" 
                     priority={index === 0}
                   /> 
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 border-none text-white" />
        <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 border-none text-white" />
      </Carousel>
    </div>
  );
}
