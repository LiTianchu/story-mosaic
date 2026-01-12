import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingMain from "./components/Landing/LandingMain";
import EditMain from "./components/Edit/EditMain";
import AuthMain from "./components/Auth/AuthMain";
import ManageStoryMain from "./components/ManageStory/ManageStoryMain";
import ReaderMain from "./components/Reader/ReaderMain";
import Navigation from "./components/Common/Navigation";
import StoryDetail from "./components/StoryDetail/StoryDetail";
import AccountManagement from "./components/AccountManagement/AccountManagement";
import ProtectedRoute from "./components/Common/ProtectedRoute";

// Main Router component with routes protected by authentication
const Router = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-paper">
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingMain />} />
          <Route
            path="/edit/:storyId"
            element={
              <ProtectedRoute>
                <EditMain />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthMain />} />
          <Route
            path="/managestory"
            element={
              <ProtectedRoute>
                <ManageStoryMain />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reader/:storyId"
            element={
              <ProtectedRoute>
                <ReaderMain />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/story/:storyId"
            element={
              <ProtectedRoute>
                <StoryDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="bg-paper border-2 border-dashed border-danger rounded-lg p-8 text-center text-dark-ink font-medium">
                  Page Not Found - 404
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
