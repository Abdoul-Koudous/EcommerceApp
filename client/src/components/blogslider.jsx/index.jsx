// BlogSlider.jsx
import React, { useRef } from 'react';
import BlogItem from '../blogitem';
import "./blogslider.scss";

const BlogSlider = ({ items = 3 }) => {
  const blogs = [
    {
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzXaJC8HYw8enxdcPRj-5-oNSkjplNT_mM9Q&s",
      title: "Comment booster vos ventes en ligne",
      date: "20 octobre 2025",
      description: "Découvrez les meilleures stratégies pour augmenter vos ventes et attirer plus de clients."
    },
    {
      image: "https://img.freepik.com/free-photo/person-working-laptop_23-2148178447.jpg",
      title: "Les secrets d’un bon design web",
      date: "18 octobre 2025",
      description: "Un design réussi attire, rassure et convertit. Voici les bases à connaître."
    },
    {
      image: "https://img.freepik.com/free-photo/social-media-marketing_53876-94833.jpg",
      title: "Maîtriser le marketing digital",
      date: "10 octobre 2025",
      description: "Apprenez à utiliser les réseaux sociaux et le référencement pour faire grandir votre marque."
    },
    {
      image: "https://img.freepik.com/free-photo/ecommerce-concept_53876-92867.jpg",
      title: "Créer une boutique e-commerce rentable",
      date: "5 octobre 2025",
      description: "Les erreurs à éviter et les astuces pour réussir dans le e-commerce."
    }
  ];

  const visibleBlogs = blogs.slice(0, items);
  const sliderRef = useRef(null);

  const scrollLeft = () => sliderRef.current.scrollBy({ left: -400, behavior: "smooth" });
  const scrollRight = () => sliderRef.current.scrollBy({ left: 400, behavior: "smooth" });

  return (
    <section className="blog-slider">
      <button className="banner-btn left" onClick={scrollLeft}>‹</button>

      <div className="blog-container" ref={sliderRef} style={{ '--items': items }}>
        {visibleBlogs.map((blog, index) => (
          <BlogItem key={index} {...blog} />
        ))}
      </div>

      <button className="banner-btn right" onClick={scrollRight}>›</button>
    </section>
  );
};

export default BlogSlider;
