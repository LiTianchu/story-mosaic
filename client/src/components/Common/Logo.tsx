import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  isLink?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = "md",
  showSubtitle = false,
  isLink = true,
}) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="text-center group">
      <div className="flex justify-center items-center gap-2">
        {/* Logo and Title */}
        {isLink ? (
          <Link to="/" className="flex justify-center items-center gap-2">
            <img
              src="/story_mosaic_logo.svg"
              alt="Story Mosaic Logo"
              className="w-9 h-9"
            />
            <h1
              className={`${sizeClasses[size]} font-semibold text-secondary-btn transition-colors`}
            >
              Story Mosaic
            </h1>
          </Link>
        ) : (
          <div className="flex justify-center items-center gap-2">
            <img
              src="/story_mosaic_logo.svg"
              alt="Story Mosaic Logo"
              className="w-9 h-9"
            />
            <h1
              className={`${sizeClasses[size]} font-semibold text-secondary-btn transition-colors`}
            >
              Story Mosaic
            </h1>
          </div>
        )}
      </div>
      {/* Subtitle */}
      {showSubtitle && (
        <p className="text-faint-ink text-sm mt-1">
          Collaborative Story Game Creation
        </p>
      )}
    </div>
  );
};

export default Logo;
