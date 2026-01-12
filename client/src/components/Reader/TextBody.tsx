import { useEffect, useRef } from "react";
function TextBody(props: { textContent?: string }) {
  const textContentRef = useRef<HTMLParagraphElement>(null);
  // When textContent changes, show a simple fade-in effect
  useEffect(() => {
    // reset transition to make sure it restarts each time the text content changes
    if (textContentRef.current) {
      textContentRef.current.style.transition = "";
    }

    if (textContentRef.current) {
      textContentRef.current.style.opacity = "0";
      setTimeout(() => {
        if (textContentRef.current) {
          textContentRef.current.style.transition = "opacity 0.5s";
          textContentRef.current.style.opacity = "1";
        }
      }, 50);
    }
  }, [props.textContent]);

  const textContent: string = props.textContent || "Loading story content...";

  return (
    <div className="prose bg-paper max-w-none space-y-6">
      <p ref={textContentRef}>{textContent}</p>
    </div>
  );
}
export default TextBody;
