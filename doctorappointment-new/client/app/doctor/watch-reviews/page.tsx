"use client";
import { axiosFetchDoctor } from "@/lib/axiosConfig";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

interface Review {
  id: string;
  appointmentId: string;
  patientName: string;
  rate: number;
  comment: string;
  problem: string;
  doctorReply: string | null;
  doctorRepliedAt: string | null;
  createdAt: string | null;
  helpfulCount: number;
}

const PAGE_SIZE = 10;

export default function Page() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    axiosFetchDoctor()
      .get(`/get-my-reviews?page=${page}&size=${PAGE_SIZE}`)
      .then((res) => {
        const data = res.data || {};
        setReviews(Array.isArray(data.content) ? data.content : []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      })
      .catch(() => setError("Error fetching reviews."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReply = async (reviewId: string) => {
    const reply = (replyDraft[reviewId] || "").trim();
    if (!reply) {
      toast.error("Reply cannot be empty");
      return;
    }
    const token = localStorage.getItem("token") || "";
    setSavingId(reviewId);
    try {
      await axiosFetchDoctor(token).post("/reply-review", { reviewId, reply });
      toast.success("Reply saved");
      setReplyDraft((prev) => ({ ...prev, [reviewId]: "" }));
      fetchReviews();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save reply");
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-2 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
              <div className="h-2 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
        <p className="text-sm text-gray-500">
          {totalElements} review{totalElements === 1 ? "" : "s"}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-5 rounded-xl border hover:shadow-md hover:border-teal-200 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">
                    {(review.patientName || "P").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">{review.patientName}</h2>
                    {review.createdAt && (
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-bold text-gray-700">{review.rate}/5</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">{review.comment || "No comment provided."}</p>
              <p className="text-xs text-gray-400 italic mb-3">
                Problem: {review.problem || "N/A"}
              </p>

              {review.doctorReply ? (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-2 border-teal-500">
                  <p className="text-xs font-semibold text-teal-700 mb-1">
                    Your reply{review.doctorRepliedAt ? ` · ${formatDate(review.doctorRepliedAt)}` : ""}
                  </p>
                  <p className="text-sm text-gray-700">{review.doctorReply}</p>
                </div>
              ) : (
                <div className="mt-3">
                  <textarea
                    rows={2}
                    placeholder="Reply to this review..."
                    value={replyDraft[review.id] || ""}
                    onChange={(e) =>
                      setReplyDraft((prev) => ({ ...prev, [review.id]: e.target.value }))
                    }
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => submitReply(review.id)}
                    disabled={savingId === review.id}
                    className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {savingId === review.id ? "Saving..." : "Post reply"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
