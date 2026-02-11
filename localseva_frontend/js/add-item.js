/**
 * Add/Edit item page functionality
 */

let isEditing = false;
let editProductId = null;

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  // Check if editing
  const urlParams = new URLSearchParams(window.location.search);
  editProductId = urlParams.get("edit");

  if (editProductId) {
    isEditing = true;
    await loadProductForEdit(editProductId);
  }

  initAddItemPage();
});

/**
 * Initialize add item page
 */
function initAddItemPage() {
  const form = document.getElementById("addItemForm");
  if (!form) return;

  // Character count for description
  const description = document.getElementById("itemDescription");
  const charCount = document.getElementById("charCount");

  if (description && charCount) {
    description.addEventListener("input", function () {
      const length = this.value.length;
      charCount.textContent = length;

      // Update character count color
      charCount.className = "char-count";
      if (length > 900) {
        charCount.classList.add("warning");
      }
      if (length > 980) {
        charCount.classList.add("error");
      }
    });
  }

  // Setup image upload boxes
  setupImageUploads();

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateItemForm()) {
      return;
    }

    const formData = getItemFormData();

    console.log("Submitting form data...");
    console.log("Is editing:", isEditing);
    console.log("Edit product ID:", editProductId);

    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = isEditing
      ? '<i class="fas fa-spinner fa-spin"></i> Updating...'
      : '<i class="fas fa-spinner fa-spin"></i> Listing Item...';

    // Show loading overlay
    showLoading();

    try {
      let result;
      if (isEditing && editProductId) {
        // Update existing product
        result = await api.updateProduct(editProductId, formData);
        appUtils.showNotification("Product updated successfully!", "success");
      } else {
        // Create new product
        result = await api.createProduct(formData);
        appUtils.showNotification("Item listed successfully!", "success");
      }

      console.log("Product saved successfully:", result);

      // Redirect to product page
      setTimeout(() => {
        window.location.href = `product-detail.html?id=${result.id}`;
      }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);

      let errorMessage =
        error.message || "Failed to save item. Please try again.";

      // Parse the error message to make it more user-friendly
      try {
        // Check if it's a JSON string
        if (errorMessage.startsWith("{") || errorMessage.startsWith("[")) {
          const errorObj = JSON.parse(errorMessage);
          if (typeof errorObj === "object") {
            // Extract first error message
            const firstKey = Object.keys(errorObj)[0];
            const firstError = errorObj[firstKey];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === "string") {
              errorMessage = firstError;
            }
          }
        }
      } catch (e) {
        // Not JSON, use original error message
      }

      appUtils.showNotification(errorMessage, "error");

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    } finally {
      // Hide loading overlay
      hideLoading();
    }
  });
}

/**
 * Load product for editing
 */
async function loadProductForEdit(productId) {
  try {
    console.log("Loading product for edit:", productId);
    const product = await api.getProduct(productId);

    console.log("Product loaded:", product);

    // Update form title
    document.getElementById("pageTitle").textContent = "Edit Product";
    document.getElementById("formTitle").textContent = "Edit Product";
    document.getElementById("formSubtitle").textContent =
      "Update your product details";

    // Update submit button text
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Item';
    }

    // Fill form fields
    document.getElementById("itemTitle").value = product.title || "";
    document.getElementById("itemDescription").value =
      product.description || "";
    document.getElementById("itemCategory").value = product.category || "";
    document.getElementById("itemCondition").value = product.condition || "";
    document.getElementById("itemPrice").value = product.price || "";
    document.getElementById("itemCity").value = product.city || "";
    document.getElementById("itemAddress").value = product.address || "";
    document.getElementById("contactWhatsapp").value =
      product.contact_whatsapp || "";
    document.getElementById("contactEmail").checked =
      product.contact_email || false;

    // Update character count
    const charCount = document.getElementById("charCount");
    if (charCount) {
      charCount.textContent = product.description?.length || 0;
    }

    // Set existing images (if any)
    // Note: For editing, we would need to handle existing images differently
    // This is a placeholder - you might want to show existing images
  } catch (error) {
    console.error("Error loading product for edit:", error);
    appUtils.showNotification("Failed to load product for editing", "error");
    setTimeout(() => (window.location.href = "my-products.html"), 1500);
  }
}

/**
 * Setup image upload functionality
 */
function setupImageUploads() {
  // Click handlers are already set up in HTML inline handlers
  // This function can be used for additional setup if needed
}

/**
 * Validate add item form
 */
function validateItemForm() {
  console.log("Validating form...");

  const itemTitle = document.getElementById("itemTitle");
  const itemDescription = document.getElementById("itemDescription");
  const itemCategory = document.getElementById("itemCategory");
  const itemCondition = document.getElementById("itemCondition");
  const itemPrice = document.getElementById("itemPrice");
  const itemCity = document.getElementById("itemCity");
  const itemAddress = document.getElementById("itemAddress");
  const mainImage = document.getElementById("mainImage");

  let isValid = true;

  // Clear previous errors
  document.querySelectorAll(".error-message").forEach((el) => {
    el.style.display = "none";
  });

  document.querySelectorAll(".form-control").forEach((el) => {
    el.classList.remove("error");
  });

  // Validate title
  const titleValue = itemTitle.value.trim();
  if (!titleValue) {
    isValid = false;
    itemTitle.classList.add("error");
    document.getElementById("titleError").style.display = "flex";
    console.log("Title validation failed");
  }

  // Validate description
  const descriptionValue = itemDescription.value.trim();
  if (!descriptionValue) {
    isValid = false;
    itemDescription.classList.add("error");
    document.getElementById("descriptionError").style.display = "flex";
    console.log("Description validation failed");
  } else if (descriptionValue.length > 1000) {
    isValid = false;
    itemDescription.classList.add("error");
    document.getElementById("descriptionError").style.display = "flex";
    console.log("Description too long");
  }

  // Validate category
  if (!itemCategory.value) {
    isValid = false;
    itemCategory.classList.add("error");
    document.getElementById("categoryError").style.display = "flex";
    console.log("Category validation failed");
  }

  // Validate condition
  if (!itemCondition.value) {
    isValid = false;
    itemCondition.classList.add("error");
    document.getElementById("conditionError").style.display = "flex";
    console.log("Condition validation failed");
  }

  // Validate price
  const priceValue = itemPrice.value.trim();
  if (
    !priceValue ||
    isNaN(parseFloat(priceValue)) ||
    parseFloat(priceValue) <= 0
  ) {
    isValid = false;
    itemPrice.classList.add("error");
    document.getElementById("priceError").style.display = "flex";
    console.log("Price validation failed:", priceValue);
  }

  // Validate city
  if (!itemCity.value) {
    isValid = false;
    itemCity.classList.add("error");
    document.getElementById("cityError").style.display = "flex";
    console.log("City validation failed");
  }

  // Validate address
  const addressValue = itemAddress.value.trim();
  if (!addressValue) {
    isValid = false;
    itemAddress.classList.add("error");
    document.getElementById("addressError").style.display = "flex";
    console.log("Address validation failed");
  }

  // Validate WhatsApp number
  const contactWhatsapp = document.getElementById("contactWhatsapp");
  const whatsappValue = contactWhatsapp.value.trim();
  if (!whatsappValue) {
    isValid = false;
    contactWhatsapp.classList.add("error");
    document.getElementById("whatsappError").style.display = "flex";
    console.log("WhatsApp number validation failed");
  }

  // Check if main image is required (only for new products)
  if (!isEditing && !mainImage.files[0]) {
    isValid = false;
    document.getElementById("imageError").style.display = "flex";
    console.log("Image validation failed - no main image");
  }

  if (!isValid) {
    appUtils.showNotification(
      "Please fill in all required fields correctly",
      "error",
    );
  } else {
    console.log("Form validation passed");
  }

  return isValid;
}

/**
 * Get form data from add item form
 */
function getItemFormData() {
  console.log("Getting form data...");

  // Create FormData
  const formData = new FormData();

  // Get values
  const title = document.getElementById("itemTitle").value.trim();
  const description = document.getElementById("itemDescription").value.trim();
  const category = document.getElementById("itemCategory").value;
  const condition = document.getElementById("itemCondition").value;
  const price = document.getElementById("itemPrice").value;
  const city = document.getElementById("itemCity").value;
  const address = document.getElementById("itemAddress").value.trim();
  const contactWhatsapp = document
    .getElementById("contactWhatsapp")
    .value.trim();
  const contactEmail = document.getElementById("contactEmail").checked;

  console.log("Form values:", {
    title,
    description,
    category,
    condition,
    price,
    city,
    address,
    contactWhatsapp,
    contactEmail,
  });

  // Append text fields (exact field names as per API)
  formData.append("title", title);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("condition", condition);
  formData.append("price", price);
  formData.append("city", city);
  formData.append("address", address);
  formData.append("contact_whatsapp", contactWhatsapp);
  // Append contact_email as boolean
  formData.append("contact_email", contactEmail);

  // Append image files
  const mainImage = document.getElementById("mainImage");
  const image2 = document.getElementById("image2");
  const image3 = document.getElementById("image3");

  if (mainImage.files[0]) {
    formData.append("main_image", mainImage.files[0]);
    console.log("Main image added:", mainImage.files[0].name);
  }

  if (image2.files[0]) {
    formData.append("image_2", image2.files[0]);
    console.log("Image 2 added:", image2.files[0].name);
  }

  if (image3.files[0]) {
    formData.append("image_3", image3.files[0]);
    console.log("Image 3 added:", image3.files[0].name);
  }

  // Log FormData for debugging
  console.log("FormData entries:");
  for (let pair of formData.entries()) {
    console.log(pair[0] + ": ", pair[1]);
  }

  return formData;
}

/**
 * Show loading overlay
 */
function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

/**
 * Cancel form
 */
function cancelForm() {
  if (confirm("Are you sure? All unsaved changes will be lost.")) {
    window.history.back();
  }
}
