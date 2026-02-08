import { PublicSidebar } from "@/components/layout/public-sidebar";
import { HomeHero } from "@/components/home/home-hero";
import { AboutSection, ContactSection, CourseSection, NewsSection } from "@/components/home/home-info-section";
import { Separator } from "@/components/ui/separator";
import { ScrollIndicator } from "@/components/home/scroll-indicator";


export default function Home() {
  return (
    <div className="flex bg-[#34313c] min-h-screen selection:bg-[#ffc000] selection:text-[#34313c]">
      {/* Sidebar - Visible on Desktop */}
      <PublicSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full h-screen overflow-y-auto scroll-smooth">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center px-4 py-4 sticky top-0 bg-[#34313c]/95 backdrop-blur-md z-50 border-b border-white/10">
            <span className="font-bold text-lg text-white">NTUST RRC</span>
            <a href="/auth/login" className="text-sm font-bold text-[#34313c] bg-[#ffc000] px-4 py-1.5 rounded-full hover:bg-yellow-400 transition-colors">登入</a>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col">
          
          {/* 1. Hero Section */}
          <section id="hero" className="h-[88vh] flex items-center px-4 md:px-8 lg:px-12 py-12 md:py-0 relative">
            <HomeHero />
            
            {/* Scroll Down Indicator */}
            {/* Handled by global ScrollIndicator component */}
          </section>


           {/* 2. About Section - Alt Background (Deep) */}
          <section id="about" className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20 bg-black/20">
             <AboutSection />
          </section>

           {/* 3. News Section (Base/Light) */}
          <section id="news" className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20">
             <NewsSection />
          </section>

           {/* 4. Course Section - Alt Background (Deep) */}
          <section id="courses" className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20 bg-black/20">
             <CourseSection />
          </section>

           {/* 5. Contact Section (Base/Light) */}
          <section id="contact" className="px-4 md:px-8 lg:px-12 py-12 scroll-mt-20">
             <ContactSection />
          </section>
          
          {/* Footer Copyright */}
          <footer className="text-center text-slate-500 text-xs py-8 border-t border-white/5 bg-black/20">
            © {new Date().getFullYear()} NTUST Robot Researchers Club. All rights reserved.
          </footer>
          
          <ScrollIndicator />
        </div>
      </main>
    </div>
  );
}
