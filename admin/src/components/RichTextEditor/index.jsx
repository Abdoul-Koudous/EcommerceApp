import Editor, {
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnUnderline,
  Toolbar,
  createDropdown,
} from "react-simple-wysiwyg";
import { sanitizeRichText } from "../RichTextContent/richTextUtils";
import "./richTextEditor.scss";

const BtnTextStyle = createDropdown("Style", [
  ["Normal", "formatBlock", "P"],
  ["Titre 2", "formatBlock", "H2"],
  ["Titre 3", "formatBlock", "H3"],
  ["Titre 4", "formatBlock", "H4"],
]);

const RichTextEditor = ({ value, onChange, placeholder, className = "" }) => (
  <div className={`rich-text-editor ${className}`.trim()}>
    <Editor
      value={sanitizeRichText(value)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder || "Écrivez votre texte..."}
      containerProps={{ className: "rich-text-editor__container" }}
    >
      <Toolbar>
        <BtnTextStyle />
        <BtnBold />
        <BtnItalic />
        <BtnUnderline />
        <BtnBulletList />
        <BtnNumberedList />
        <BtnLink />
        <BtnClearFormatting />
      </Toolbar>
    </Editor>
  </div>
);

export default RichTextEditor;
