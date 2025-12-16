import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import HeroSection from '@/components/landing/HeroSection';
import ModulesSection from '@/components/landing/ModulesSection';
import UserTypesSection from '@/components/landing/UserTypesSection';
import CTASection from '@/components/landing/CTASection';

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ModulesSection />
      <UserTypesSection />
      <CTASection />
      <Footer />
    </>
  );
} 