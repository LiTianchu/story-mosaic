import type { UserProfile } from "@/types/data";
import { useNavigate } from "react-router-dom";

function UserAvatar({
  user,
  size = 9,
  isLinked = true,
}: {
  user: UserProfile | null;
  size?: number;
  isLinked?: boolean;
}) {
  const navigate = useNavigate();

  const handleClickAvatar = () => {
    if (!isLinked) {
      return;
    }
    navigate(`/account`);
  };

  const avatarSrc =
    user?.avatarImage && user.avatarImage.trim().length > 0
      ? user.avatarImage
      : null;

  return (
    <div>
      {user == null ? (
        // Placeholder for unauthenticated user
        <div
          onClick={handleClickAvatar}
          className={`grid h-${size} w-${size} place-items-center overflow-hidden rounded-full border border-black/10 bg-gray-200 ${
            isLinked ? "cursor-pointer" : ""
          }`}
        >
          <span className="text-light-ink font-semibold">U</span>
        </div>
      ) : (
        // User avatar section
        <div
          onClick={handleClickAvatar}
          className={`grid h-${size} w-${size} place-items-center overflow-hidden rounded-full border border-black/10 hover:shadow ${
            isLinked ? "cursor-pointer" : ""
          }`}
        >
          {avatarSrc ? (
            // User avatar image
            <img
              alt={user.displayName}
              src={avatarSrc}
              className="h-full w-full object-cover"
            />
          ) : (
            // Placeholder for user without avatar image
            <div className="flex h-full w-full items-center justify-center bg-secondary-btn text-center text-light-ink font-semibold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
