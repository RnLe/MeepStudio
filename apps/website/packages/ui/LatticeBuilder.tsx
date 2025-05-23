import React from "react";
import { Square, RectangleHorizontal, Hexagon, Diamond, Shapes } from "lucide-react";

const latticeTypes = [
  { key: "square", title: "Square", Icon: Square },
  { key: "rectangle", title: "Rectangle", Icon: RectangleHorizontal },
  { key: "hexagon", title: "Hexagon", Icon: Hexagon },
  { key: "rhombic", title: "Rhombic", Icon: Diamond },
  { key: "oblique", title: "Oblique", Icon: Diamond }, // fallback for oblique
  { key: "custom", title: "Custom", Icon: Shapes },
];

export default function LatticeBuilder() {
  return (
    <div className="flex flex-col h-full w-full p-0">
      {/* Panel Content */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4">
          {latticeTypes.map(({ key, title, Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center justify-center"
            >
              <div className="flex items-center justify-center aspect-square w-full max-w-[120px] bg-gray-700 rounded-2xl cursor-pointer transition hover:bg-gray-500 group shadow-lg">
                <Icon size={48} className="text-gray-300 group-hover:text-white transition" />
              </div>
              <span className="text-white text-base font-medium text-center mt-3 select-none">
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
