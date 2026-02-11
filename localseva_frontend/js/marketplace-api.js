/**
 * Marketplace API functions
 * This file should be loaded after api.js
 */

const MarketplaceAPI = {
  API_BASE_URL: "https://localseva-kuak.onrender.com/api/user/",

  /**
   * Get products with filters
   */
  async getProducts(filters = {}) {
    try {
      console.log("Getting products with filters:", filters);

      // Build query parameters
      const params = new URLSearchParams();

      // Add filter parameters based on API documentation
      if (filters.category) params.append("category", filters.category);
      if (filters.condition) params.append("condition", filters.condition);
      if (filters.city) params.append("city", filters.city);
      if (filters.is_sold !== undefined)
        params.append("is_sold", filters.is_sold);
      if (filters.min_price !== undefined)
        params.append("min_price", filters.min_price);
      if (filters.max_price !== undefined)
        params.append("max_price", filters.max_price);
      if (filters.search) params.append("search", filters.search);
      if (filters.ordering) params.append("ordering", filters.ordering);

      const queryString = params.toString();
      const endpoint = `marketplace/${queryString ? `?${queryString}` : ""}`;
      const fullUrl = this.API_BASE_URL + endpoint;

      console.log("Full API URL:", fullUrl);

      const token = localStorage.getItem("accessToken");
      console.log("Token exists:", !!token);

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        console.log("Response not OK");
        let errorText;
        try {
          errorText = await response.text();
          console.log("Error response text:", errorText);
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        } catch (e) {
          throw new Error(
            `HTTP ${response.status}: ${errorText || response.statusText}`
          );
        }
      }

      const data = await response.json();
      console.log("Products data received:", data);
      console.log(
        "Number of products:",
        Array.isArray(data) ? data.length : "Not an array"
      );
      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  /**
   * Get a single product by ID
   */
  async getProduct(id) {
    try {
      console.log("Getting product with ID:", id);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const response = await fetch(`${this.API_BASE_URL}marketplace/${id}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      const product = await response.json();
      console.log("Product received:", product);
      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  /**
   * Create a new product (using FormData for images)
   */
  async createProduct(formData) {
    try {
      console.log("Creating product with FormData");
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const endpoint = `${this.API_BASE_URL}marketplace/create/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("API error response:", errorData);
        } catch (e) {
          const text = await response.text();
          errorData = { text: text };
        }

        let errorMessage = "Failed to create product";
        if (errorData) {
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === "object") {
            const errors = [];
            for (const [field, messages] of Object.entries(errorData)) {
              if (Array.isArray(messages)) {
                errors.push(`${field}: ${messages.join(", ")}`);
              } else if (typeof messages === "string") {
                errors.push(`${field}: ${messages}`);
              }
            }
            if (errors.length > 0) {
              errorMessage = errors.join("; ");
            }
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Product created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  /**
   * Update a product
   */
  async updateProduct(id, formData) {
    try {
      console.log("Updating product", id);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const endpoint = `${this.API_BASE_URL}marketplace/${id}/`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("API error response:", errorData);
        } catch (e) {
          const text = await response.text();
          errorData = { text: text };
        }

        throw new Error(errorData?.detail || "Failed to update product");
      }

      const result = await response.json();
      console.log("Product updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  /**
   * Delete (deactivate) a product
   */
  async deleteProduct(id) {
    try {
      console.log("Deleting product", id);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const response = await fetch(`${this.API_BASE_URL}marketplace/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },
};

// Make it globally available
window.marketplaceAPI = MarketplaceAPI;
