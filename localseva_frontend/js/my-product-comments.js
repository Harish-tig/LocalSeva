/**
 * My Product Comments page functionality
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Load comments
  await loadMyProductComments();
});

/**
 * Load comments on user's products
 */
async function loadMyProductComments() {
  try {
    const comments = await api.getMyProductComments();

    // Update stats
    updateStats(comments);

    // Render comments
    renderComments(comments);
  } catch (error) {
    console.error("Error loading comments:", error);

    const container = document.getElementById("commentsContainer");
    if (container) {
      container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading comments</h3>
                    <p>Please try again later.</p>
                </div>
            `;
    }
  }
}

/**
 * Update statistics
 */
function updateStats(comments) {
  const totalComments = comments.length;
  const visibleComments = comments.filter((c) => c.is_visible).length;
  const hiddenComments = comments.filter((c) => !c.is_visible).length;

  // Get unique product IDs
  const uniqueProducts = [...new Set(comments.map((c) => c.product))];
  const commentedProducts = uniqueProducts.length;

  // Update stat elements
  document.getElementById("totalComments").textContent = totalComments;
  document.getElementById("visibleComments").textContent = visibleComments;
  document.getElementById("hiddenComments").textContent = hiddenComments;
  document.getElementById("commentedProducts").textContent = commentedProducts;
}

/**
 * Render comments
 */
function renderComments(comments) {
  const container = document.getElementById("commentsContainer");

  if (comments.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>No Comments Yet</h3>
                <p>Comments on your products will appear here.</p>
            </div>
        `;
    return;
  }

  // Group comments by product
  const commentsByProduct = {};
  comments.forEach((comment) => {
    if (!commentsByProduct[comment.product]) {
      commentsByProduct[comment.product] = {
        product_id: comment.product,
        product_title: comment.product_title || "Product",
        comments: [],
      };
    }
    commentsByProduct[comment.product].comments.push(comment);
  });

  // Render grouped comments
  container.innerHTML = Object.values(commentsByProduct)
    .map(
      (productGroup) => `
        <div class="product-comments-group">
            <div class="product-header">
                <h4>${productGroup.product_title}</h4>
                <a href="product-detail.html?id=${
                  productGroup.product_id
                }" class="btn btn-sm btn-outline">
                    <i class="fas fa-external-link-alt"></i> View Product
                </a>
            </div>
            
            ${productGroup.comments
              .map(
                (comment) => `
                <div class="activity-item comment-item" data-comment-id="${
                  comment.id
                }">
                    <div class="activity-info">
                        <div class="activity-title">
                            <strong>${comment.user_name}</strong>
                            ${
                              comment.is_visible
                                ? ""
                                : '<span class="badge badge-warning" style="margin-left: 0.5rem;">Hidden</span>'
                            }
                        </div>
                        <div class="activity-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(
                              comment.created_at
                            ).toLocaleDateString()}</span>
                            <span><i class="fas fa-clock"></i> ${new Date(
                              comment.created_at
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</span>
                        </div>
                        <p style="margin-top: 0.5rem;">${comment.comment}</p>
                        ${
                          comment.contact_info
                            ? `
                            <div class="contact-info">
                                <i class="fas fa-phone"></i>
                                <small>${comment.contact_info}</small>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="activity-actions">
                        ${
                          comment.is_visible
                            ? `
                            <button class="btn btn-sm btn-warning hide-comment-btn">
                                <i class="fas fa-eye-slash"></i> Hide
                            </button>
                        `
                            : `
                            <button class="btn btn-sm btn-success show-comment-btn">
                                <i class="fas fa-eye"></i> Show
                            </button>
                        `
                        }
                        <button class="btn btn-sm btn-danger delete-comment-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `
    )
    .join("");

  // Add event listeners to action buttons
  setupCommentActions();
}

/**
 * Setup comment action buttons
 */
function setupCommentActions() {
  // Hide comment buttons
  document.querySelectorAll(".hide-comment-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const commentItem = this.closest(".comment-item");
      const commentId = commentItem.dataset.commentId;

      if (
        confirm(
          "Hide this comment? The commenter will still see it, but others won't."
        )
      ) {
        try {
          await api.deleteComment(commentId);
          appUtils.showNotification("Comment hidden", "success");
          // Reload comments
          await loadMyProductComments();
        } catch (error) {
          appUtils.showNotification("Failed to hide comment", "error");
        }
      }
    });
  });

  // Show comment buttons (for hidden comments)
  document.querySelectorAll(".show-comment-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const commentItem = this.closest(".comment-item");
      const commentId = commentItem.dataset.commentId;

      // Note: The API doesn't have a "show" endpoint, so we might need to update the comment
      // or the backend might restore it. For now, we'll just reload.
      appUtils.showNotification(
        "To show a comment, you may need to contact support or edit the product.",
        "info"
      );
    });
  });

  // Delete comment buttons
  document.querySelectorAll(".delete-comment-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const commentItem = this.closest(".comment-item");
      const commentId = commentItem.dataset.commentId;

      if (
        confirm(
          "Permanently delete this comment? This action cannot be undone."
        )
      ) {
        try {
          await api.deleteComment(commentId);
          appUtils.showNotification("Comment deleted", "success");
          // Reload comments
          await loadMyProductComments();
        } catch (error) {
          appUtils.showNotification("Failed to delete comment", "error");
        }
      }
    });
  });
}
