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

const images = [
  {
    src: "/placeholder1", // Using divs for now as we don't have real images
    alt: "Robot Researchers 1",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    text: "機器人競賽 - 精彩瞬間"
  },
  {
    src: "/placeholder2",
    alt: "Robot Researchers 2",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    text: "社課教學 - 手把手教學"
  },
  {
    src: "/placeholder3", 
    alt: "Robot Researchers 3",
    color: "bg-gradient-to-r from-orange-400 to-red-500",
    text: "社團活動 - 迎新大會"
  },
];

export function HomeCarousel() {
  const plugin = useRef(
    Autoplay({ delay: 10000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center relative group">
      <Carousel
        plugins={[plugin.current]}
        opts={{ loop: true }}
        className="w-full h-full"
      >
        <CarouselContent className="h-full">
          {images.map((item, index) => (
            <CarouselItem key={index} className="h-full">
              <div className="flex flex-col h-full w-full">
                {/* Top: Text Section (Smaller) */}
                <div className={`w-full h-[30%] ${item.color} flex flex-col items-center justify-center text-white p-4 text-center`}>
                   <h3 className="text-xl md:text-2xl font-bold tracking-wider drop-shadow-md">
                     {item.text}
                   </h3>
                </div>
                
                {/* Bottom: Image Section (16:9 container or Flex fill) */}
                <div className="w-full flex-1 relative bg-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Placeholder for Image */}
                  <div className="text-slate-500 flex flex-col items-center">
                    <span className="text-sm">Image Area (16:9)</span>
                    <span className="text-xs opacity-50">{item.src}</span>
                  </div>
                   {/* 
                   <Image 
                     src={item.src} 
                     alt={item.alt} 
                     fill 
                     className="object-cover" 
                   /> 
                   */}
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
