import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { FeedbackFormData, FeedbackType, FeedbackOutcome } from "@/types/feedback";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";

const DRAFT_STORAGE_KEY = "feedback_draft";
const SUBMISSION_COOLDOWN_MS = 1000; // Prevent double submission within 1 second

export default function FeedbackSubmission() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || undefined;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: "inspection",
    title: "",
    description: "",
    outcome: undefined,
    keyLearning: "",
    homeSetting: "",
    roleAtTime: "",
    sessionId,
    isAnonymised: true,
    consentToShare: false,
  });

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (err) {
        console.warn("Failed to load draft:", err);
      }
    }
  }, []);

  // Auto-save draft to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }, 500);

    return () => clearTimeout(timer);
  }, [formData]);

  // Validation helper
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Your experience description is required";
    } else if (formData.description.trim().length < 50) {
      errors.description = `Description must be at least 50 characters (currently ${formData.description.trim().length})`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = (field: keyof FeedbackFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Prevent double submission
    const now = Date.now();
    if (now - lastSubmitTime < SUBMISSION_COOLDOWN_MS) {
      setError("Please wait a moment before submitting again");
      return;
    }

    // Validate form
    if (!validateForm()) {
      posthog?.capture("feedback_validation_failed", {
        errors: Object.keys(validationErrors),
      });
      return;
    }

    setLoading(true);
    setLastSubmitTime(now);

    try {
      if (!session?.access_token) {
        throw new Error("You need to be signed in to submit feedback");
      }

      posthog?.capture("feedback_submission_started", {
        feedback_type: formData.feedbackType,
        has_session_id: !!sessionId,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-inspection-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to submit feedback";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse JSON, use status text
          if (response.status === 429) {
            errorMessage = "You're submitting too frequently. Please wait a moment.";
          } else if (response.status === 401) {
            errorMessage = "Your session has expired. Please sign in again.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }
        throw new Error(errorMessage);
      }

      posthog?.capture("feedback_submission_successful", {
        feedback_type: formData.feedbackType,
      });

      setSubmitted(true);
      // Clear draft after successful submission
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Feedback submission error:", err);
      const message = err instanceof Error ? err.message : "Failed to submit feedback";
      setError(message);

      posthog?.capture("feedback_submission_failed", {
        error: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank you!</h1>
          <p className="text-slate-600 mb-6">
            Your feedback has been submitted successfully. We'll review it and may feature it in our public gallery.
          </p>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const isSubmitDisabled = loading || !formData.title.trim() || formData.description.trim().length < 50;
  const descriptionLength = formData.description.trim().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(sessionId ? `/app/report/${sessionId}` : "/app/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 py-1"
            tabIndex={0}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Share Your Experience</h1>
          <p className="text-slate-600">
            Help other childcare leaders by sharing feedback from your inspection or interview.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {/* Draft saved indicator */}
          {!submitted && !error && (
            <div className="mb-4 text-xs text-slate-500 text-center">
              💾 Your draft is automatically saved
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Error Alert */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Submission failed</p>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                What type of feedback?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["inspection", "fit_person", "practice"] as FeedbackType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("feedbackType", type)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleChange("feedbackType", type);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      formData.feedbackType === type
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    tabIndex={0}
                  >
                    {type === "fit_person" ? "Fit Person" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="E.g., 'What I learned from my Ofsted inspection'"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                  validationErrors.title ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
                required
                tabIndex={0}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
                Your experience * ({descriptionLength}/50 characters minimum)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Share what happened, what you learned, and what helped you prepare (or would have helped)..."
                rows={6}
                className={`resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                  validationErrors.description ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
                required
                tabIndex={0}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
              {!validationErrors.description && descriptionLength > 0 && (
                <p className={`mt-1 text-xs ${descriptionLength < 50 ? "text-amber-600" : "text-emerald-600"}`}>
                  {descriptionLength < 50 ? "⚠️" : "✓"} {descriptionLength >= 50 ? "Good to go!" : "Add more details"}
                </p>
              )}
            </div>

            {/* Outcome */}
            <div>
              <label htmlFor="outcome" className="block text-sm font-semibold text-slate-900 mb-2">
                Outcome (optional)
              </label>
              <select
                id="outcome"
                value={formData.outcome || ""}
                onChange={(e) => handleChange("outcome", e.target.value || undefined)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                tabIndex={0}
              >
                <option value="">Select outcome...</option>
                <option value="outstanding">Outstanding</option>
                <option value="good">Good</option>
                <option value="requires_improvement">Requires Improvement</option>
                <option value="inadequate">Inadequate</option>
                <option value="passed">Passed (Interview)</option>
                <option value="needs_work">Needs Work</option>
                <option value="preparing">Still Preparing</option>
              </select>
            </div>

            {/* Key Learning */}
            <div>
              <label htmlFor="keyLearning" className="block text-sm font-semibold text-slate-900 mb-2">
                Key learning (optional)
              </label>
              <input
                id="keyLearning"
                type="text"
                value={formData.keyLearning || ""}
                onChange={(e) => handleChange("keyLearning", e.target.value)}
                placeholder="E.g., 'Safeguarding documentation was the biggest gap'"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                tabIndex={0}
              />
            </div>

            {/* Home Setting & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="homeSetting" className="block text-sm font-semibold text-slate-900 mb-2">
                  Setting type (optional)
                </label>
                <input
                  id="homeSetting"
                  type="text"
                  value={formData.homeSetting || ""}
                  onChange={(e) => handleChange("homeSetting", e.target.value)}
                  placeholder="E.g., Residential, Supported Living"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  tabIndex={0}
                />
              </div>
              <div>
                <label htmlFor="roleAtTime" className="block text-sm font-semibold text-slate-900 mb-2">
                  Your role (optional)
                </label>
                <input
                  id="roleAtTime"
                  type="text"
                  value={formData.roleAtTime || ""}
                  onChange={(e) => handleChange("roleAtTime", e.target.value)}
                  placeholder="E.g., Manager, Deputy, Staff"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  tabIndex={0}
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isAnonymised}
                  onChange={(e) => handleChange("isAnonymised", e.target.checked)}
                  className="mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                  tabIndex={0}
                />
                <div>
                  <p className="font-medium text-sm text-slate-900">Keep my identity private</p>
                  <p className="text-xs text-slate-600">Your name and home won't be published</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.consentToShare}
                  onChange={(e) => handleChange("consentToShare", e.target.checked)}
                  className="mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                  tabIndex={0}
                />
                <div>
                  <p className="font-medium text-sm text-slate-900">Share in public gallery</p>
                  <p className="text-xs text-slate-600">Help other leaders by sharing (anonymised)</p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                tabIndex={0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(sessionId ? `/app/report/${sessionId}` : "/app/dashboard")}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                tabIndex={0}
              >
                Cancel
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-slate-500 text-center">
              Your feedback helps us improve MockOfsted and supports other care leaders.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
