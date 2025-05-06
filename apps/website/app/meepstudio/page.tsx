// Import logger
import { logger } from "@meepstudio/utils";
import { StudioLayout } from "@meepstudio/ui";
 
export default function MeepStudio() {
  // Logging
  logger.trace('Calling MeepStudio');
 
  // Return the JSX
  return (
    <div className="w-full h-full flex">
      <div className="flex-1 flex flex-col">
        <StudioLayout ghPages={true} />
      </div>
    </div>
  );
}