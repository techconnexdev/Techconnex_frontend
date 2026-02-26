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
          <h2 className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl text-center text-gray-900 tracking-tight">
            {title}
          </h2>
        </div>
      )}
      {text && (
        <p className="text-center text-gray-600 md:text-xl mx-auto mt-8 md:mt-12 leading-relaxed">
          {text}
        </p>
      )}
    </div>
  );
};

export default Heading;
