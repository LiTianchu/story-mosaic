import React, { useState } from "react";

interface ResetPasswordFormProps {
  onSubmit: (email: string) => Promise<boolean>;
  loading: boolean;
  onSwitchToLogin: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  loading,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="resetEmail"
          className="block text-sm font-medium text-dark-ink mb-1"
        >
          Email:
        </label>
        <input
          type="email"
          id="resetEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email to reset password"
          required
          className="w-full px-3 py-2 border border-faint-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-700 text-light-ink py-2 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Sending..." : "Send Reset Email"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-faint-ink hover:text-add-btn hover:drop-shadow transition-colors text-sm cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
