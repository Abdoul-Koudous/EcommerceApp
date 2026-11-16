import "./richTextContent.scss";
import { sanitizeRichText } from "./richTextUtils";

const RichTextContent = ({ value, className = "" }) => (
  <div
    className={`rich-text-content ${className}`.trim()}
    dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }}
  />
);

export default RichTextContent;
