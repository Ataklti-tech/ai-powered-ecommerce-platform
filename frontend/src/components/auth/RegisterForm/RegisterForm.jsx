import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
  Check,
} from "lucide-react";

export default function RegisterForm() {
  // const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    gender: "",
    address: [
      {
        label: "home",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        isDefault: true,
      },
    ],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      address: [
        {
          ...prev.address[0],
          [name]: value,
        },
      ],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.passwordConfirm) {
      setError("Password and Confirm password are not the same");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `https://localhost:5000/api/v1/auth/register`,
        formData,
        { withCredentials: true },
      );
      // navigate();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "AI-powered personalized recommendations",
    "Exclusive deals and early access",
    "Fast and secure checkout",
    "Order tracking and history",
    "Wishlist and saved items",
    "24/7 customer support",
  ];

  const handleNextStep = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      setError("Please complete all required fields");
      return;
    }
    setError("");
    setCurrentStep(2);
  };
  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding & Benefits */}
        <div className="hidden lg:block">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Pick<span className="text-orange-500">Perfect</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of happy shoppers and experience AI-powered
              shopping today.
            </p>
          </div>

          {/* Benefits List */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Member Benefits
            </h3>
            <div className="space-y-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full">
          <div className="bg-white border-2 border-gray-100 rounded-3xl p-10 shadow-xl">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= 1
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    1
                  </div>
                  <span
                    className={`font-medium ${currentStep >= 1 ? "text-gray-900" : "text-gray-400"}`}
                  >
                    Account Info
                  </span>
                </div>
                <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      currentStep >= 2
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 w-full"
                        : "w-0"
                    }`}
                  ></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= 3
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`font-medium ${currentStep >= 2 ? "text-gray-900" : currentStep >= 2 ? "text-gray-400" : currentStep >= 2 ? "text-gray-400" : ""}`}
                  >
                    Password
                  </span>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>
              <p className="text-gray-600">
                Start your personalized shopping journey
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <>
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Kumakech"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Michael"
                        className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-md focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+256755961654"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-md focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Password & Preferences */}
              {currentStep === 2 && (
                <>
                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Must be at least 8 characters
                    </p>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* gender */}
                  {/* address */}

                  {/* Terms & Marketing */}
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-400 cursor-pointer mt-0.5"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{" "}
                        <a
                          href="#"
                          className="text-orange-500 hover:text-orange-600 font-semibold"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="text-orange-500 hover:text-orange-600 font-semibold"
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>

                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="marketingEmails"
                        checked={formData.marketingEmails}
                        onChange={handleChange}
                        className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-400 cursor-pointer mt-0.5"
                      />
                      <span className="text-sm text-gray-700">
                        Send me exclusive deals, personalized recommendations,
                        and updates
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* current step 3 */}
              {currentStep === 3 && <></>}

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 font-semibold rounded-sm hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>
                    {currentStep === 1 ? "Continue" : "Create Account"}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Divider - Only on Step 1 */}
              {currentStep === 1 && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">
                        Or sign up with
                      </span>
                    </div>
                  </div>

                  {/* Social Sign Up Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className="py-3 px-4 cursor-pointer bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-center space-x-2 text-gray-700 font-medium"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Google</span>
                    </button>

                    {/* <button
                      type="button"
                      className="py-3 px-4 cursor-pointer bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-center space-x-2 text-gray-700 font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="#1877F2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span>Facebook</span>
                    </button> */}
                  </div>
                </>
              )}
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
