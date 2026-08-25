import React, { useRef, useEffect, useState } from "react";
import BlogItem from "../blogitem";
import { getArticles, formatDate } from "../../pages/blog/data";
import "./blogslider.scss";

const BlogSlider = ({ items = 3 }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);

        // excludeFeatured: false -> le slider peut afficher aussi l'article
        // à la une ; passe à true si tu veux le même comportement que la
        // page liste (qui l'exclut car déjà affiché en hero).
        const { articles } = await getArticles({
          excludeFeatured: false,
          perPage: items,
        });

        setBlogs(articles);
      } catch (error) {
        console.error(error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [items]);

  const scrollLeft = () =>
    sliderRef.current.scrollBy({ left: -400, behavior: "smooth" });

  const scrollRight = () =>
    sliderRef.current.scrollBy({ left: 400, behavior: "smooth" });

  if (loading) return <p>Chargement des blogs...</p>;
  if (blogs.length === 0) return <p>Aucun blog disponible.</p>;

  return (
    <section className="blog-slider">
      <button className="banner-btn left" onClick={scrollLeft}>‹</button>

      <div className="blog-container" ref={sliderRef}>
        {blogs.map((blog) => (
          <BlogItem
            key={blog._id}
            _id={blog._id}
            image={blog.image}
            title={blog.title}
            date={blog.date ? formatDate(blog.date) : ""}
            description={blog.excerpt}
          />
        ))}
      </div>

      <button className="banner-btn right" onClick={scrollRight}>›</button>
    </section>
  );
};

export default BlogSlider;