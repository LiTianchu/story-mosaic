import React, { useState } from "react";
import type { AuthForms } from "../../types/auth";

interface SignUpFormProps {
  onSubmit: (data: AuthForms) => void;
  loading: boolean;
  onSwitchToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  loading,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<AuthForms>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setValidationError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
          {validationError}
        </div>
      )}

      <div>
        <label
          htmlFor="signupEmail"
          className="block text-sm font-medium text-dark-ink mb-1"
        >
          Email:
        </label>
        <input
          type="email"
          id="signupEmail"
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
          htmlFor="signupPassword"
          className="block text-sm font-medium text-dark-ink mb-1"
        >
          Password:
        </label>
        <input
          type="password"
          id="signupPassword"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password (min 6 characters)"
          required
          className="w-full px-3 py-2 border border-faint-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-dark-ink mb-1"
        >
          Confirm Password:
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          className="w-full px-3 py-2 border border-faint-ink rounded-lg focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-3 text-dark-ink py-2 px-4 bg-add-btn text-light-ink rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-add-btn focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Creating Account..." : "Sign Up"}
      </button>

      <div className="text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-faint-ink hover:text-add-btn hover:drop-shadow transition-colors text-sm cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </form>
  );
};

export default SignUpForm;
