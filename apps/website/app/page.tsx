// Import logger
import { logger } from "../packages/utils/logger";
import StudioLayout from "packages/ui/StudioLayout";
 
export default function HomePage() {
  // Logging
  logger.trace('Calling HomePage');
 
  // Return the JSX
  return (
    <div className="w-full h-full flex">
      <div className="flex-1 flex flex-col">
        <StudioLayout ghPages={true} />
      </div>
    </div>
  );
}