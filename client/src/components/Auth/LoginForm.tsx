import React, { useState } from "react";
import type { AuthForms } from "../../types/auth";

interface LoginFormProps {
  onSubmit: (data: AuthForms) => void;
  loading: boolean;
  onSwitchToSignup: () => void;
  onSwitchToReset: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading,
  onSwitchToSignup,
  onSwitchToReset,
}) => {
  const [formData, setFormData] = useState<AuthForms>({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-dark-ink mb-1"
        >
          Email:
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Write your email here..."
          required
          className="w-full px-3 py-2 border border-faint-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-dark-ink mb-1"
        >
          Password:
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Write your password here..."
          required
          className="w-full px-3 py-2 border border-faint-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-secondary-btn text-light-ink py-2 px-4 rounded-lg hover:bg-add-btn focus:outline-none focus:ring-2 focus:ring-add-btn focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-faint-ink hover:text-add-btn hover:drop-shadow transition-colors cursor-pointer"
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={onSwitchToReset}
          className="text-faint-ink hover:text-add-btn hover:drop-shadow transition-colors cursor-pointer"
        >
          Reset Password
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
