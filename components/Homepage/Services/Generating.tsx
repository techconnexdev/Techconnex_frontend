import loading from "@/public/assets/favicon.svg";

interface GeneratingProps {
  className?: string;
}

const Generating = ({ className }: GeneratingProps) => {
  return (
    <div
      className={`flex items-center h-[3.5rem] px-6 bg-secondary/80 backdrop-blur-3xl rounded-[1.7rem] border border-border ${
        className || ""
      } text-base`}
    >
      <img className="w-5 h-5 mr-4" src={loading.src} alt="Loading" />
      AI is searching for oppurtunities...
    </div>
  );
};

export default Generating;
