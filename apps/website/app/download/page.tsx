// Import logger
import { logger } from "@meepstudio/utils";
import { DownloadPagePlaceholder } from "src/components/DownloadPagePlaceholder";
 
export default function Download() {
  // Logging
  logger.trace('Calling Download');
 
  // Return the JSX
  return (
    <div className="w-auto h-auto">
      <div className="flex flex-col items-center justify-center w-full h-full pt-5">
        <h1 className="text-4xl font-bold mb-4">Download MeepStudio</h1>
        <p className="text-lg mb-8">Choose your platform to get started.</p>
        <DownloadPagePlaceholder />
      </div>
    </div>
  );
}