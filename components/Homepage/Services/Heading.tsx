import TagLine from "./Tagline";

interface HeadingProps {
  className?: string;
  title?: string;
  text?: string;
  tag?: string;
}

const Heading = ({ className, title, text, tag }: HeadingProps) => {
  return (
    <div className={`${className || ""} mb-12 lg:mb-20 md:text-center`}>
      {tag && (
        <div className="max-w-[50rem] mx-auto">
          <TagLine className="mb-4 md:justify-center">{tag}</TagLine>
        </div>
      )}
      {title && (
        <div className="flex justify-center w-full overflow-hidden">
          <h2 className="text-5xl md:text-6xl font-medium tracking-tighter whitespace-nowrap">
            {title}
          </h2>
        </div>
      )}
      {text && (
        <p className="text-gray-950 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
          {text}
        </p>
      )}
    </div>
  );
};

export default Heading;
