// Import logger
import { logger } from "@meepstudio/utils";
 
export default function HomePage() {
  // Logging
  logger.trace('Calling HomePage');
 
  // Return the JSX
  return (
    <div className="w-full h-full flex">
      It works!!
    </div>
  );
}