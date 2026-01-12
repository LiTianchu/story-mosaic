import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ResetPasswordForm from "./ResetPasswordForm";
import Logo from "../Common/Logo";
import Message from "../Common/Message";
import Loading from "../Common/Loading";
import type { AuthForms } from "../../types/auth";

type AuthView = "login" | "signup" | "reset";

const AuthMain: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, error, login, signup, resetPassword, clearError } =
    useAuth();
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [resetEmailSent, setResetEmailSent] = useState(false); // Track reset email success

  // Redirect to landing page when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogin = (data: AuthForms) => {
    login(data.email, data.password);
  };

  const handleSignup = (data: AuthForms) => {
    signup(data.email, data.password, "Anonymous User");
  };

  const handleResetPassword = async (email: string): Promise<boolean> => {
    const success = await resetPassword(email);
    if (success) {
      setResetEmailSent(true);
    }
    return success;
  };

  const handleClearError = () => {
    clearError();
  };

  return (
    <div className="flex min-h-screen bg-below-paper items-center justify-center p-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-paper rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <Logo size="lg" showSubtitle isLink={false} />
          </div>

          {error && (
            <Message type="error" message={error} onClose={handleClearError} />
          )}

          {loading && <Loading />}

          {currentView === "login" && !loading && (
            <LoginForm
              onSubmit={handleLogin}
              loading={loading}
              onSwitchToSignup={() => setCurrentView("signup")}
              onSwitchToReset={() => setCurrentView("reset")}
            />
          )}

          {currentView === "signup" && !loading && (
            <>
              <SignUpForm
                onSubmit={handleSignup}
                loading={loading}
                onSwitchToLogin={() => setCurrentView("login")}
              />
            </>
          )}

          {currentView === "reset" && (
            <>
              {resetEmailSent && (
                <Message
                  type="success"
                  message="Password reset email sent. Please check your inbox."
                  onClose={() => setResetEmailSent(false)}
                />
              )}
              {!loading && (
                <ResetPasswordForm
                  onSubmit={handleResetPassword}
                  loading={loading}
                  onSwitchToLogin={() => {
                    setCurrentView("login");
                    setResetEmailSent(false);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthMain;
