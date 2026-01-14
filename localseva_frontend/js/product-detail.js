/**
 * Product detail page functionality
 */

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    appUtils.showNotification("Product not found", "error");
    setTimeout(() => (window.location.href = "mart.html"), 1500);
    return;
  }

  // Load product and comments
  await loadProduct(productId);
  await loadComments(productId);

  // Setup comment form
  setupCommentForm(productId);

  // Setup character count for comment
  const commentText = document.getElementById("commentText");
  const charCount = document.getElementById("commentCharCount");

  if (commentText && charCount) {
    commentText.addEventListener("input", function () {
      charCount.textContent = this.value.length;
    });
  }
});

/**
 * Load product details
 */
async function loadProduct(productId) {
  const container = document.getElementById("productContainer");

  try {
    const product = await api.getProduct(productId);

    // Get current user info
    const currentUser = await api.getCurrentUser();
    const isSeller = currentUser && currentUser.id === product.seller;

    // Show/hide comment form (only show if not seller and product is active)
    const commentFormContainer = document.getElementById(
      "commentFormContainer"
    );
    if (
      commentFormContainer &&
      !isSeller &&
      product.is_active &&
      !product.is_sold
    ) {
      commentFormContainer.style.display = "block";
    }

    // Show seller actions if user is the seller
    const sellerActions = document.getElementById("sellerActions");
    if (sellerActions && isSeller) {
      sellerActions.style.display = "flex";

      // Setup seller action buttons
      document
        .getElementById("editProductBtn")
        .addEventListener("click", () => {
          window.location.href = `add-item.html?edit=${productId}`;
        });

      document
        .getElementById("deleteProductBtn")
        .addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete this product?")) {
            try {
              await api.deleteProduct(productId);
              appUtils.showNotification(
                "Product deleted successfully",
                "success"
              );
              setTimeout(
                () => (window.location.href = "my-products.html"),
                1500
              );
            } catch (error) {
              appUtils.showNotification("Failed to delete product", "error");
            }
          }
        });

      document
        .getElementById("markSoldBtn")
        .addEventListener("click", async () => {
          if (confirm("Mark this product as sold?")) {
            try {
              await api.updateProduct(productId, { is_sold: true });
              appUtils.showNotification("Product marked as sold", "success");
              loadProduct(productId); // Reload product
            } catch (error) {
              appUtils.showNotification("Failed to update product", "error");
            }
          }
        });
    }

    // Render product
    renderProduct(product);
  } catch (error) {
    console.error("Error loading product:", error);
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Product Not Found</h3>
                <p>This product may have been removed or doesn't exist.</p>
                <button onclick="window.location.href='mart.html'" class="btn btn-primary">
                    <i class="fas fa-arrow-left"></i> Back to Marketplace
                </button>
            </div>
        `;
  }
}

/**
 * Render product details
 */
function renderProduct(product) {
  const container = document.getElementById("productContainer");

  // Format price
  const price = parseFloat(product.price).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  // Format date
  const date = new Date(product.created_at);
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Create image gallery
  const images = [product.main_image, product.image_2, product.image_3].filter(
    (img) => img
  );
  let imageGallery = "";

  if (images.length > 0) {
    imageGallery = `
            <div class="product-images">
                <img src="${images[0]}" alt="${
      product.title
    }" class="main-image">
                ${
                  images.length > 1
                    ? `
                    <div class="image-thumbnails">
                        ${images
                          .map(
                            (img, index) => `
                            <img src="${img}" alt="${product.title} - Image ${
                              index + 1
                            }" 
                                 class="image-thumbnail ${
                                   index === 0 ? "active" : ""
                                 }"
                                 onclick="changeMainImage('${img}', this)">
                        `
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
        `;
  } else {
    imageGallery = `
            <div class="empty-state">
                <i class="fas fa-image"></i>
                <p>No images available</p>
            </div>
        `;
  }

  // Create condition badge
  const conditionLabels = {
    NEW: "Brand New",
    LIKE_NEW: "Like New",
    GOOD: "Good",
    FAIR: "Fair",
    POOR: "Poor",
  };

  const conditionClass = {
    NEW: "badge-success",
    LIKE_NEW: "badge-primary",
    GOOD: "badge-primary",
    FAIR: "badge-warning",
    POOR: "badge-danger",
  };

  container.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-images-section">
                ${imageGallery}
            </div>
            
            <div class="product-info-section">
                ${
                  product.is_sold
                    ? `
                    <div class="sold-badge">
                        <i class="fas fa-tag"></i> SOLD
                    </div>
                `
                    : ""
                }
                
                <h1>${product.title}</h1>
                
                <div class="product-price">${price}</div>
                
                <div class="product-meta">
                    <div class="product-meta-item">
                        <i class="fas fa-tag"></i>
                        <span>${product.category.replace("_", " ")}</span>
                    </div>
                    <div class="product-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${product.city}</span>
                    </div>
                    <div class="product-meta-item">
                        <i class="fas fa-eye"></i>
                        <span>${product.views} views</span>
                    </div>
                    <div class="product-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                
                <div class="product-condition">
                    <span class="badge ${conditionClass[product.condition]}">
                        ${conditionLabels[product.condition]}
                    </span>
                </div>
                
                <div class="product-description">
                    <h3>Description</h3>
                    <p>${product.description || "No description provided."}</p>
                </div>
                
                <div class="seller-info">
                    <div class="seller-header">
                        <div class="seller-avatar">
                            ${
                              product.seller_avatar
                                ? `<img src="${product.seller_avatar}" alt="${product.seller_name}">`
                                : `<i class="fas fa-user-circle"></i>`
                            }
                        </div>
                        <div>
                            <h4>${product.seller_name}</h4>
                            ${
                              product.seller_rating
                                ? `
                                <div class="seller-rating">
                                    <i class="fas fa-star"></i>
                                    <span>${product.seller_rating}/5</span>
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    
                    <div class="seller-contact">
                        <h4>Contact Seller</h4>
                        ${
                          product.contact_phone
                            ? `
                            <div class="contact-method">
                                <i class="fas fa-phone"></i>
                                <span>${product.contact_phone}</span>
                            </div>
                        `
                            : ""
                        }
                        ${
                          product.contact_whatsapp
                            ? `
                            <div class="contact-method">
                                <i class="fab fa-whatsapp"></i>
                                <span>${product.contact_whatsapp}</span>
                            </div>
                        `
                            : ""
                        }
                        ${
                          product.contact_email
                            ? `
                            <div class="contact-method">
                                <i class="fas fa-envelope"></i>
                                <span>Email Available</span>
                            </div>
                        `
                            : ""
                        }
                        <div class="contact-method">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${product.address}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Change main image in gallery
 */
function changeMainImage(src, element) {
  // Update main image
  const mainImage = document.querySelector(".main-image");
  if (mainImage) {
    mainImage.src = src;
  }

  // Update active thumbnail
  document.querySelectorAll(".image-thumbnail").forEach((img) => {
    img.classList.remove("active");
  });
  element.classList.add("active");
}

/**
 * Load product comments
 */
async function loadComments(productId) {
  const container = document.getElementById("commentsContainer");

  try {
    const comments = await api.getProductComments(productId);

    if (!comments || comments.length === 0) {
      container.innerHTML = `
                <div class="empty-state" style="min-height: 100px;">
                    <i class="fas fa-comments"></i>
                    <p>No comments yet. Be the first to express interest!</p>
                </div>
            `;
      return;
    }

    renderComments(comments);
  } catch (error) {
    console.error("Error loading comments:", error);
    container.innerHTML = `
            <div class="empty-state" style="min-height: 100px;">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading comments</p>
            </div>
        `;
  }
}

/**
 * Render comments
 */
function renderComments(comments) {
  const container = document.getElementById("commentsContainer");

  container.innerHTML = `
        <div class="comments-list">
            ${comments
              .map(
                (comment) => `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <div class="commenter-info">
                            ${
                              comment.user_avatar
                                ? `<img src="${comment.user_avatar}" alt="${comment.user_name}" class="comment-avatar">`
                                : `<i class="fas fa-user-circle comment-avatar-icon"></i>`
                            }
                            <div>
                                <strong>${comment.user_name}</strong>
                                <div class="comment-date">
                                    ${new Date(
                                      comment.created_at
                                    ).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        ${
                          comment.is_visible
                            ? ""
                            : '<span class="badge badge-warning">Hidden</span>'
                        }
                    </div>
                    
                    <div class="comment-content">
                        <p>${comment.comment}</p>
                        ${
                          comment.contact_info
                            ? `
                            <div class="comment-contact">
                                <i class="fas fa-phone"></i>
                                <small>${comment.contact_info}</small>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    
                    <!-- Delete button (for comment owner or product seller) -->
                    <div class="comment-actions" style="display: none;">
                        <button class="btn btn-sm btn-danger delete-comment-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

/**
 * Setup comment form
 */
function setupCommentForm(productId) {
  const form = document.getElementById("addCommentForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const commentText = document.getElementById("commentText").value.trim();
    const contactInfo = document.getElementById("contactInfo").value.trim();

    if (!commentText) {
      appUtils.showNotification("Please enter a message", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
      const commentData = {
        product: parseInt(productId),
        comment: commentText,
        contact_info: contactInfo || null,
      };

      await api.createComment(commentData);

      appUtils.showNotification("Message sent successfully!", "success");

      // Clear form
      form.reset();
      document.getElementById("commentCharCount").textContent = "0";

      // Reload comments
      await loadComments(productId);
    } catch (error) {
      console.error("Error creating comment:", error);
      appUtils.showNotification(
        "Failed to send message. Please try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
