import { NotFoundActions } from "@/components/Homepage/NotFoundActions";

export default function NotFound() {
  return (
    <div className="relative isolate min-h-screen flex flex-col">
      <main className="flex-1 overflow-x-hidden flex items-center">
        <section className="py-10 md:py-16 w-full">
          <div className="container text-center">
            <div className="max-w-screen-md mx-auto">
              <p className="text-sm uppercase tracking-wider bg-white/80 text-gray-700 max-w-max mx-auto px-3 py-1 rounded-full border border-blue-200/50 backdrop-blur-md shadow-sm mb-6 md:mb-10">
                Error 404
              </p>
              <h1 className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl">
                Page not found
                <span className="relative isolate ms-4">
                  .
                  <span
                    className="absolute -z-10 top-2 -left-6 -right-4 bottom-0.5 bg-gradient-to-r from-blue-100/60 to-orange-100/60 rounded-full px-8 ms-3 border border-blue-200/30 shadow-[inset_0px_0px_30px_0px] shadow-blue-200/30 md:top-3 md:bottom-1 lg:top-4 lg:bottom-2"
                    aria-hidden
                  />
                </span>
              </h1>
              <p className="text-muted-foreground md:text-xl mb-8">
                The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
              </p>
              <NotFoundActions />
            </div>
            <div className="relative mt-12 max-w-screen-sm mx-auto">
              <div
                className="absolute bg-blue-400/20 inset-5 blur-[50px] -z-10 rounded-full"
                aria-hidden
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-700/15 to-blue-700 blur-[120px] scale-y-75 scale-x-125 rounded-full -z-10"
                aria-hidden
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
