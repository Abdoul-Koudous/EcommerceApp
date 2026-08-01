import React, { useRef, useEffect, useState } from "react";
import BlogItem from "../blogitem";
import { fetchDataFromApi } from "../../pages/utils/api";
import "./blogslider.scss";

const BlogSlider = ({ items = 3 }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const sliderRef = useRef(null);

  // 🔥 FETCH BLOGS (avec ta route réelle)
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);

        const res = await fetchDataFromApi("/api/blog/");

        // 🔥 IMPORTANT (adapter selon ton controller)
        const blogsData = res?.blogs || res?.data || res || [];

        setBlogs(blogsData);
      } catch (error) {
        console.error(error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const scrollLeft = () =>
    sliderRef.current.scrollBy({ left: -400, behavior: "smooth" });

  const scrollRight = () =>
    sliderRef.current.scrollBy({ left: 400, behavior: "smooth" });

  if (loading) return <p>Chargement des blogs...</p>;
  if (blogs.length === 0) return <p>Aucun blog disponible.</p>;

  const visibleBlogs = blogs.slice(0, items);

  return (
    <section className="blog-slider">
      <button className="banner-btn left" onClick={scrollLeft}>‹</button>

      <div className="blog-container" ref={sliderRef}>
        {visibleBlogs.map((blog) => (
          <BlogItem
            key={blog._id}
            _id={blog._id}
            image={blog.images?.[0]}
            title={blog.title}
            date={
              blog.createdAt
                ? new Date(blog.createdAt).toLocaleDateString("fr-FR")
                : ""
            }
            description={blog.description}
          />
        ))}
      </div>

      <button className="banner-btn right" onClick={scrollRight}>›</button>
    </section>
  );
};

export default BlogSlider;