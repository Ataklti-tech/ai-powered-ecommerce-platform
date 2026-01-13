import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
// import "./HeroSection.css";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Summer Collection",
      subtitle: "New Arrivals",
      description: "Discover the latest trends in fashion and lifestyle",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      buttonText: "Shop Now",
      buttonLink: "/products",
      theme: "light"
    },
    {
      id: 2,
      title: "Tech Essentials",
      subtitle: "Up to 40% Off",
      description: "Upgrade your workspace with the latest gadgets",
      image:
        "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200",
      buttonText: "Explore Deals",
      buttonLink: "/deals",
      theme: "dark"
    },
    {
      id: 3,
      title: "Home Decor",
      subtitle: "Transform Your Space",
      description: "Beautiful pieces to make your house a home",
      image: "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=1200",
      buttonText: "Browse Collection",
      buttonLink: "/category/home",
      theme: "light"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="hero">
      <div className="hero__slider">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero__slide ${
              index === currentSlide ? "hero__slide--active" : ""
            } hero__slide--${slide.theme}`}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${slide.image})`
            }}
          >
            <div className="hero__content">
              <span className="hero__subtitle">{slide.subtitle}</span>
              <h1 className="hero__title">{slide.title}</h1>
              <p className="hero__description">{slide.description}</p>
              <a href={slide.buttonLink} className="hero__button">
                {slide.buttonText}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        className="hero__nav hero__nav--prev"
        onClick={goToPrevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="hero__nav hero__nav--next"
        onClick={goToNextSlide}
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="hero__dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`hero__dot ${
              index === currentSlide ? "hero__dot--active" : ""
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
