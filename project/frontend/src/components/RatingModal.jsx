import React, { useState, useEffect } from 'react';
import { StarIcon, XIcon, MessageSquareIcon, CheckIcon } from './Icons';
import { api } from '../api';

export const RatingModal = ({ item, user, onClose, onRatingSubmitted, showToast, orderId = null }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!item?.id) return;
    loadRatings();
  }, [item?.id]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const [reviewsData, summaryData] = await Promise.all([
        api.ratings.getByMenu(item.id),
        api.ratings.getSummary(item.id),
      ]);
      setReviews(reviewsData || []);
      setSummary(summaryData || null);

      // If user already wrote a review for this item, pre-fill it
      if (user && reviewsData) {
        const myReview = reviewsData.find((r) => r.userId === user.id);
        if (myReview) {
          setSelectedRating(myReview.rating);
          setComment(myReview.comment || '');
        }
      }
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to submit a rating.', 'error');
      return;
    }
    if (selectedRating < 1 || selectedRating > 5) {
      showToast('Please select a star rating between 1 and 5.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.ratings.submit(item.id, selectedRating, comment, orderId);
      showToast(`Thank you! Your ${selectedRating}★ rating has been saved.`, 'success');
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      loadRatings();
    } catch (err) {
      showToast(err.message || 'Failed to submit rating.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalReviews = summary?.totalRatings || reviews.length;
  const avgScore = summary?.averageRating || (item.averageRating || 0);

  const getPercent = (count) => {
    if (!totalReviews || totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{item.name}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
              {item.category || 'Special Dish'} • Customer Reviews & Ratings
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-content">
          {/* Summary Breakdown Box */}
          <div className="rating-summary-box">
            <div className="rating-big-score">
              <div className="score-num">{avgScore > 0 ? avgScore.toFixed(1) : '0.0'}</div>
              <div className="score-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    size={16}
                    filled={star <= Math.round(avgScore)}
                  />
                ))}
              </div>
              <div className="score-total">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</div>
            </div>

            <div className="distribution-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary?.distribution?.[star] || 0;
                const percent = getPercent(count);
                return (
                  <div className="dist-row" key={star}>
                    <span className="dist-label">{star}★</span>
                    <div className="dist-track">
                      <div className="dist-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="dist-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Submission Form */}
          <form className="review-form-card" onSubmit={handleSubmit}>
            <div className="form-title">
              {user ? (
                <span>Rate this dish as <strong>{user.displayName || user.username}</strong></span>
              ) : (
                <span>Rate this dish (Log in required)</span>
              )}
            </div>

            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= (hoverRating || selectedRating) ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setSelectedRating(star)}
                  title={`${star} Star`}
                >
                  <StarIcon size={26} filled={star <= (hoverRating || selectedRating)} />
                </button>
              ))}
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 700, marginLeft: '0.5rem', alignSelf: 'center' }}>
                {hoverRating || selectedRating} / 5 Stars
              </span>
            </div>

            <textarea
              className="review-textarea"
              placeholder="Write your review or feedback (e.g. Taste, portion size, spice level, freshness...)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {1000 - comment.length} characters left
              </span>
              <button
                type="submit"
                className="submit-review-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>

          {/* Customer Reviews List */}
          <div>
            <div className="reviews-header">
              <span>Customer Feedback</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                {reviews.length} {reviews.length === 1 ? 'Comment' : 'Comments'}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                <MessageSquareIcon size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--text-dim)' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No reviews yet for this dish.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((rev) => (
                  <div className="review-item" key={rev.id}>
                    <div className="review-user-row">
                      <div className="review-user-info">
                        <div className="review-avatar">
                          {(rev.userDisplayName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="review-username">{rev.userDisplayName || 'Student'}</div>
                          <div className="review-time">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon key={s} size={14} filled={s <= rev.rating} />
                        ))}
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="review-comment">{rev.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
