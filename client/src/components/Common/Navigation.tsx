import { useLocation } from "react-router-dom";
import { useUser } from "@hooks/useUser";
import Logo from "./Logo";
import UserAvatar from "./UserAvatar";

const EXCLUDED_PATHS = ["/reader", "/edit", "/auth"];
const Navigation = () => {
  const location = useLocation();
  const { userProfile } = useUser();

  const shouldMount = !EXCLUDED_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    shouldMount && (
      <header className="bg-below-paper/50 backdrop-blur-md shadow-sm text-light-ink sticky w-full top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo Section */}
            <Logo size="sm" />
            {/* User Avatar Section */}
            <nav className="flex items-center space-x-4">
              <UserAvatar user={userProfile} />
            </nav>
          </div>
        </div>
      </header>
    )
  );
};

export default Navigation;
