function ChapterHeader(props: { chapterTitle: string | null }) {
  return (
    <div className={`text-left ${props.chapterTitle === null ? "hidden" : ""}`}>
      <p className="">{props.chapterTitle}</p>
    </div>
  );
}

export default ChapterHeader;
