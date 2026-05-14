import TagLine from "./Tagline";

interface HeadingProps {
  className?: string;
  title?: string;
  text?: string;
  tag?: string;
}

const Heading = ({ className, title, text, tag }: HeadingProps) => {
  return (
    <div className={`${className || ""} mb-12 md:text-center`}>
      {tag && (
        <div className="max-w-[50rem] mx-auto">
          <div className="mb-4 md:justify-center block text-center font-mono text-xs md:text-sm tracking-[0.3em] text-[#185df9] font-medium uppercase">{tag}</div>
        </div>
      )}
      {title && (
          <h2 className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl text-center text-gray-900 tracking-tight uppercase">
            {title}
          </h2>
      )}
      {text && (
        <p className="text-center text-gray-600 md:text-xl mx-auto  leading-relaxed">
          {text}
        </p>
      )}
    </div>
  );
};

export default Heading;
