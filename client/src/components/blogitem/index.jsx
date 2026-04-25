import React from "react";
import { IoMdTime } from "react-icons/io";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Link } from "react-router-dom";
import "./blogitem.scss";

const BlogItem = ({ image, title, date, description, _id }) => {

  // 🔥 Nettoyer HTML + limiter texte
  const getShortText = (html, maxLength = 120) => {
    if (!html) return "";

    const text = html.replace(/<[^>]+>/g, "");

    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div className="blog-item">

      {/* 🔹 IMAGE + BADGE */}
      <div className="blog-img">
        <img src={image || "/placeholder.jpg"} alt={title} />

        {/* 🔥 DATE SUR IMAGE */}
        <span className="date-badge">
          <IoMdTime /> {date}
        </span>
      </div>

      {/* 🔹 CONTENT */}
      <div className="blog-content">

        <h3 className="blog-title">{title}</h3>

        {/* 🔥 DESCRIPTION COURTE */}
        <p className="blog-desc">
          {getShortText(description, 120)}
        </p>

        {/* 🔥 LIRE PLUS */}
        <Link to={`/blog/${_id}`} className="read-more">
          Lire plus <MdKeyboardArrowRight />
        </Link>

      </div>
    </div>
  );
};

export default BlogItem;