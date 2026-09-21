import HeroSection from '../../components/customer/HeroSection.jsx';
import FeaturedCategories from '../../components/customer/FeaturedCategories.jsx';
import CategoryCarousel from '../../components/customer/CategoryCarousel.jsx';
import FeaturedPromotions from '../../components/customer/FeaturedPromotions.jsx';
import FeaturedVendors from '../../components/customer/FeaturedVendors.jsx';
import TestimonialsSection from '../../components/customer/TestimonialsSection.jsx';
import CallToAction from '../../components/customer/CallToAction.jsx';

export default function CustomerHomePage() {
  return (
    <div className="page-fade-in">
      <HeroSection />
      <FeaturedCategories />
      <CategoryCarousel />
      <FeaturedPromotions />
      <FeaturedVendors />
      <TestimonialsSection />
      <CallToAction />
    </div>
  );
}
