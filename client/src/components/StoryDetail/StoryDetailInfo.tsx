import React, { useEffect, useState } from "react";
import type { StoryDetail, UserProfile } from "@app-types/data";
import { STORY_TAG_LABELS_DICT } from "@/constants/storyTags";
import { userApi } from "@/services/api";
import UserAvatar from "@components/Common/UserAvatar";
import TagChip from "@components/Common/TagChip";

interface StoryDetailInfoProps {
  storyDetail: StoryDetail;
}

const StoryDetailInfo: React.FC<StoryDetailInfoProps> = ({ storyDetail }) => {
  const [contributorProfiles, setContributorProfiles] = useState<UserProfile[]>(
    []
  );
  const [loadingContributors, setLoadingContributors] = useState(true);

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        const profiles = await Promise.all(
          storyDetail.contributors.map((c) => userApi.getUserById(c.userId))
        );
        setContributorProfiles(profiles);
      } catch (error) {
        console.error("Failed to fetch contributor profiles:", error);
      } finally {
        setLoadingContributors(false);
      }
    };

    if (storyDetail.contributors.length > 0) {
      fetchContributors();
    } else {
      setLoadingContributors(false);
    }
  }, [storyDetail.contributors]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-paper border border-below-paper rounded-lg p-6">
      {/* Description */}
      <div className="mb-6">
        <h4 className="font-medium text-dark-ink mb-2">Description</h4>
        <p className="text-faint-ink leading-relaxed">
          {storyDetail.description}
        </p>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <h4 className="font-medium text-dark-ink mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {storyDetail.tags.map((tag, index) => (
            <TagChip
              key={index}
              label={STORY_TAG_LABELS_DICT[tag]}
              active={false}
            />
          ))}
        </div>
      </div>

      {/* Contributors */}
      <div className="mb-4">
        <h4 className="font-medium text-dark-ink mb-2">
          Contributors ({storyDetail.contributors.length})
        </h4>
        {loadingContributors ? (
          <div className="text-sm text-faint-ink">Loading contributors...</div>
        ) : contributorProfiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {contributorProfiles.map((profile) => (
              <div
                key={profile._id}
                className="inline-flex"
                title={profile.displayName}
              >
                <UserAvatar user={profile} size={8} isLinked={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-faint-ink">No contributors yet</div>
        )}
      </div>

      {/* Version Info */}
      <div className="pt-4 border-t border-faint-ink/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-faint-ink">Published:</span>
            <div className="text-dark-ink font-medium">
              {storyDetail.lastPublishedAt
                ? formatDate(storyDetail.lastPublishedAt)
                : "Not published"}
            </div>
          </div>
          <div>
            <span className="text-faint-ink">Last Updated:</span>
            <div className="text-dark-ink font-medium">
              {formatDate(storyDetail.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailInfo;
