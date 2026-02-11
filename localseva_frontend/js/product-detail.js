/**
 * Product detail page functionality
 */

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Product Detail page loading...");

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

// Store current product data globally to use in mark sold function
let currentProductData = null;

/**
 * Load product details
 */
async function loadProduct(productId) {
  const container = document.getElementById("productContainer");

  try {
    const product = await api.getProduct(productId);

    // Store product data for later use
    currentProductData = product;

    console.log("📦 Product data received:", product);
    console.log("📧 Checking email in product data:", {
      contact_email: product.contact_email,
      seller_email: product.seller_email,
      seller: product.seller,
    });

    // Get seller email - FIRST check if email is directly in product object
    let sellerEmail = "";

    // Check 1: Direct email fields in product
    if (product.seller_email) {
      sellerEmail = product.seller_email;
      console.log("📨 Found seller_email in product:", sellerEmail);
    }
    // Check 2: If product.seller is an object with email
    else if (
      product.seller &&
      typeof product.seller === "object" &&
      product.seller.email
    ) {
      sellerEmail = product.seller.email;
      console.log("📨 Found email in product.seller object:", sellerEmail);
    }
    // Check 3: If product.seller is just an ID (number), we need to fetch the seller details
    else if (product.seller && typeof product.seller === "number") {
      console.log("📨 Seller is an ID, attempting to fetch details...");
      try {
        // This assumes you have an API endpoint to get user by ID
        // If not, you'll need to rely on seller_email being in product response
        const sellerProfile = await api.getProfile(); // Or specific user endpoint
        if (sellerProfile && sellerProfile.email) {
          sellerEmail = sellerProfile.email;
          console.log("📨 Fetched email from user profile:", sellerEmail);
        }
      } catch (profileError) {
        console.log("⚠️ Could not fetch seller profile:", profileError);
      }
    }
    // Check 4: Any other possible email field
    else if (product.email) {
      sellerEmail = product.email;
      console.log("📨 Found email field in product:", sellerEmail);
    }

    console.log(
      "📧 Final seller email to display:",
      sellerEmail || "Not found",
    );

    // Get current user info
    const currentUser = await api.getCurrentUser();
    console.log("👤 Current user ID:", currentUser?.id);
    console.log("👤 Product seller ID:", product.seller);

    const isSeller =
      currentUser &&
      (currentUser.id === product.seller ||
        (typeof product.seller === "object" &&
          currentUser.id === product.seller.id));

    // Show/hide comment form (only show if not seller and product is active)
    const commentFormContainer = document.getElementById(
      "commentFormContainer",
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
                "success",
              );
              setTimeout(
                () => (window.location.href = "my-products.html"),
                1500,
              );
            } catch (error) {
              appUtils.showNotification("Failed to delete product", "error");
            }
          }
        });

      // Mark as Sold button - UPDATED to include all required fields
      document
        .getElementById("markSoldBtn")
        .addEventListener("click", async () => {
          if (confirm("Mark this product as sold?")) {
            await markProductAsSold(productId, product);
          }
        });
    }

    // Render product with seller email
    renderProduct(product, sellerEmail);
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
 * Mark product as sold - includes all required fields
 */
async function markProductAsSold(productId, productData) {
  try {
    // Create FormData with ALL required fields
    const formData = new FormData();

    // Add all required fields from current product data
    formData.append("title", productData.title || "");
    formData.append("description", productData.description || "");
    formData.append("category", productData.category || "");
    formData.append("condition", productData.condition || "");
    formData.append("price", productData.price || "");
    formData.append("address", productData.address || "");
    formData.append("city", productData.city || "");

    // Add optional fields if they exist
    if (productData.contact_phone) {
      formData.append("contact_phone", productData.contact_phone);
    }
    if (productData.contact_whatsapp) {
      formData.append("contact_whatsapp", productData.contact_whatsapp);
    }
    if (productData.contact_email) {
      formData.append("contact_email", productData.contact_email);
    }

    // Add the fields we want to update
    formData.append("is_sold", "true");
    formData.append("is_active", "false");

    console.log("FormData being sent for mark as sold:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    await api.updateProduct(productId, formData);
    appUtils.showNotification("Product marked as sold", "success");

    // Reload the product to show updated status
    await loadProduct(productId);
  } catch (error) {
    console.error("Mark sold error:", error);
    appUtils.showNotification(
      "Failed to update product: " + error.message,
      "error",
    );
  }
}

/**
 * Render product details with seller email
 */
function renderProduct(product, sellerEmail = "") {
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
    (img) => img,
  );
  let imageGallery = "";

  if (images.length > 0) {
    imageGallery = `
      <div class="product-images">
        <img src="${images[0]}" alt="${product.title}" class="main-image" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        ${
          images.length > 1
            ? `
            <div class="image-thumbnails">
              ${images
                .map(
                  (img, index) => `
                  <img src="${img}" alt="${product.title} - Image ${index + 1}" 
                       class="image-thumbnail ${index === 0 ? "active" : ""}"
                       onclick="changeMainImage('${img}', this)"
                       onerror="this.src='https://via.placeholder.com/100x100?text=Image'">
                `,
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

  // Get seller details
  const sellerName =
    product.seller_name ||
    (product.seller && product.seller.username) ||
    "Unknown Seller";
  const sellerAvatar =
    product.seller_avatar || (product.seller && product.seller.avatar);
  const sellerRating =
    product.seller_rating ||
    (product.seller && product.seller.marketplace_rating);
  const sellerReviews =
    product.seller_reviews ||
    (product.seller && product.seller.marketplace_reviews);

  // DEBUG: Check what we have for email display
  console.log("🔍 For email display:", {
    contact_email: product.contact_email,
    sellerEmail: sellerEmail,
    hasEmail: !!sellerEmail,
    shouldShowEmail: product.contact_email && sellerEmail,
  });

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
            <span>${product.category ? product.category.replace("_", " ") : "Uncategorized"}</span>
          </div>
          <div class="product-meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${product.city || "Location not specified"}</span>
          </div>
          <div class="product-meta-item">
            <i class="fas fa-eye"></i>
            <span>${product.views || 0} views</span>
          </div>
          <div class="product-meta-item">
            <i class="fas fa-calendar"></i>
            <span>${formattedDate}</span>
          </div>
        </div>
        
        <div class="product-condition">
          <span class="badge ${conditionClass[product.condition] || "badge-primary"}">
            ${conditionLabels[product.condition] || product.condition || "Unknown"}
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
                sellerAvatar
                  ? `<img src="${sellerAvatar}" alt="${sellerName}" onerror="this.src='https://via.placeholder.com/50x50?text=User'">`
                  : `<i class="fas fa-user-circle"></i>`
              }
            </div>
            <div>
              <h4>${sellerName}</h4>
              ${
                sellerRating
                  ? `
                  <div class="seller-rating">
                    <i class="fas fa-star"></i>
                    <span>${parseFloat(sellerRating).toFixed(1)}/5 (${sellerReviews || 0} reviews)</span>
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
                  <span>
                    <a href="tel:${product.contact_phone}" style="color: inherit; text-decoration: none;">
                      ${product.contact_phone}
                    </a>
                  </span>
                </div>
              `
                : ""
            }
            ${
              product.contact_whatsapp
                ? `
                <div class="contact-method">
                  <i class="fab fa-whatsapp" style="color: #25D366;"></i>
                  <span>
                    <a href="https://wa.me/${product.contact_whatsapp.replace(/[^\d+]/g, "")}" 
                       target="_blank" 
                       style="color: inherit; text-decoration: none;">
                      ${product.contact_whatsapp}
                    </a>
                  </span>
                </div>
              `
                : ""
            }
            <!-- EMAIL DISPLAY - This is the key fix -->
            ${
              product.contact_email
                ? sellerEmail
                  ? `
                  <div class="contact-method">
                    <i class="fas fa-envelope"></i>
                    <span>
                      <a href="mailto:${sellerEmail}" style="color: var(--primary); text-decoration: none;">
                        ${sellerEmail}
                      </a>
                    </span>
                  </div>
                `
                  : `
                  <div class="contact-method">
                    <i class="fas fa-envelope"></i>
                    <span style="color: #666; font-style: italic;">
                      Email available (contact via WhatsApp or comments)
                    </span>
                  </div>
                `
                : ""
            }
            <div class="contact-method">
              <i class="fas fa-map-marker-alt"></i>
              <span>${product.address || "Address not specified"}</span>
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
                    ? `<img src="${comment.user_avatar}" alt="${comment.user_name}" class="comment-avatar" onerror="this.src='https://via.placeholder.com/40x40?text=User'">`
                    : `<i class="fas fa-user-circle comment-avatar-icon"></i>`
                }
                <div>
                  <strong>${comment.user_name || "Anonymous"}</strong>
                  <div class="comment-date">
                    ${new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              ${
                comment.is_visible !== undefined && !comment.is_visible
                  ? '<span class="badge badge-warning">Hidden</span>'
                  : ""
              }
            </div>
            
            <div class="comment-content">
              <p>${comment.comment || "No comment text"}</p>
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
            
            <div class="comment-actions" style="display: none;">
              <button class="btn btn-sm btn-danger delete-comment-btn">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `,
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
        "error",
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
