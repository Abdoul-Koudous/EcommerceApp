// BlogItem.jsx
import React from 'react';
import { IoMdTime } from "react-icons/io";
import { MdKeyboardArrowRight } from "react-icons/md";
import "./blogitem.scss";

const BlogItem = ({ image, title, date, description }) => {
  return (
    <div className="blog-item">
      <div className="blog-img">
        <img src={image} alt={title} />
      </div>
      <div className="blog-content">
        <h3 className="blog-title">{title}</h3>
        <p className="blog-date"><IoMdTime />{date}</p>
        <p className="blog-desc">{description}</p>
        <button className="read-more">Lire plus<MdKeyboardArrowRight /></button>
      </div>
    </div>
  );
};

export default BlogItem;
