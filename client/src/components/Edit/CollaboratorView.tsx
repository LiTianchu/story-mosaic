import { Suspense, useMemo } from "react";
import { userApi } from "@/services/api.ts";
import type { UserProfile } from "@/types/data.ts";
import { Ellipsis } from "lucide-react";

// simple suspense wrapper for a promise
function wrapPromise<T>(promise: Promise<T>) {
  let status: "pending" | "success" | "error" = "pending";
  let result: T | unknown;
  const suspender = promise.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") throw suspender;
      if (status === "error") throw result;
      return result as T;
    },
  };
}

// load user profiles for given ids
const createUsersResource = (ids: string[]) =>
  wrapPromise(
    Promise.all(
      ids.map(async (userid) => {
        try {
          return await userApi.getUserById(userid);
        } catch (error) {
          console.error(`failed to fetch user with id ${userid}:`, error);
          return null;
        }
      })
    )
  );

function UsersList({
  resource,
  ids,
}: {
  resource: ReturnType<typeof createUsersResource>;
  ids: string[];
}) {
  const users = resource.read(); // may suspend

  return (
    <div className="flex h-full flex-row items-center justify-left gap-2">
      {users.slice(0, 4).map((user: UserProfile | null, index: number) =>
        index <= 2 ? (
          <div
            className="rounded-full bg-add-btn xl:w-9 xl:h-9 md:w-7 md:h-7 sm:w-6 sm:h-6 overflow-hidden"
            key={ids[index] ?? index}
            title={user?.displayName ?? "Unknown user"}
          >
            {user?.avatarImage ? (
              <img
                src={user.avatarImage}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white">
                {user?.displayName ? user.displayName[0] : "?"}
              </div>
            )}
          </div>
        ) : (
          <Ellipsis key={index} className="text-add-btn" />
        )
      )}
    </div>
  );
}

// Component to display collaborators currently active on a story editor
function CollaboratorView(props: { userIds: string[] }) {
  const ids = useMemo(() => {
    const uniqueIds = props.userIds ?? [];
    console.log("CollaboratorView - userIds prop changed:", uniqueIds);
    return uniqueIds;
  }, [props.userIds]);

  const resource = useMemo(() => {
    if (!ids.length) {
      console.log("CollaboratorView - no ids, skipping resource creation");
      return null;
    }
    console.log("CollaboratorView - creating resource for ids:", ids);
    return createUsersResource(ids);
  }, [ids]);

  return (
    <div className="fixed flex-col items-center rounded-bl-xl top-0 right-0 bg-node-paragraph px-4 border border-secondary-btn shadow-md xl:w-50 md:w-42 sm:w-35 xl:h-12 md:h-10 sm:h-8 z-100">
      <Suspense
        fallback={<div className="text-sm text-faint-ink">Loading...</div>}
      >
        {resource ? <UsersList resource={resource} ids={ids} /> : <div />}
      </Suspense>
    </div>
  );
}

export default CollaboratorView;
