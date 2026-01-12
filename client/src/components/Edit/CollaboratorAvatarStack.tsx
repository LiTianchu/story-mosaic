import React from "react";
import { useUser } from "../../hooks/useUser";
import UserAvatar from "@components/Common/UserAvatar";
import type { UserProfile } from "@app-types/data";

interface CollaboratorAvatarStackProps {
  userProfiles: UserProfile[];
}

const CollaboratorAvatarStack: React.FC<CollaboratorAvatarStackProps> = ({
  userProfiles,
}) => {
  const { userProfile } = useUser();

  const hasUser: boolean = !userProfile
    ? false
    : userProfiles.filter((u) => u._id === userProfile._id).length > 0;

  // console.log(hasUser, userProfile, userProfiles);

  const top: UserProfile =
    hasUser && userProfile ? userProfile : userProfiles[0];

  // console.log("Top user for avatar stack:", top);

  return (
    <div className="relative flex w-full items-center justify-around">
      {top && (
        <div className="z-10">
          <UserAvatar user={top} size={6} />
        </div>
      )}

      {/* Render up to 2 additional avatars below the top user to form a stack */}
      {userProfiles
        .filter((u) => u._id !== top._id) // exclude top user
        .slice(0, 2) // Only take first 2
        .map((profile) => (
          <div key={profile._id}>
            <UserAvatar user={profile} size={6} />
          </div>
        ))}

      {/* The fourth one will be +N if more than 3 collaborators */}
      {userProfiles.length > 3 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-dark-ink text-xs font-semibold text-light-ink">
          +{userProfiles.length - 3}
        </div>
      )}
    </div>
  );
};

export default CollaboratorAvatarStack;
