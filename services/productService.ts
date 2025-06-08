
import { Product, ProductFormData, Category, Manufacturer, SubmittedSale, SaleItem, SaleItemRecord, PaymentMethod, User, SizeStock } from '../types';
// Constants like UNCATEGORIZED_ID are still useful for frontend default logic if backend doesn't provide them or for specific UI cases.
// However, the backend will be the source of truth for IDs when creating/assigning.
// import { UNCATEGORIZED_ID, UNKNOWN_MANUFACTURER_ID } from '../constants';

// For local development, you might run your backend on a different port.
// For production, if frontend and backend are on the same domain, '/api' is fine.
// Example for local: const API_BASE_URL = 'http://localhost:3001/api';
const API_BASE_URL = 'http://localhost:3001/api'; // Assumes proxy or same-domain deployment

interface ApiError {
  message: string;
  details?: any;
}

const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status} ${response.statusText}` }));
    console.error('API Error:', errorData);
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) { // No Content
    return null as T; // Or an appropriate empty value depending on T
  }
  return response.json() as Promise<T>;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken'); // Assuming token is stored after login
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const productService = {
  // --- User Authentication & Management ---
  authenticateUser: async (username: string, passwordInput: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordInput }),
      });
      const data = await handleApiResponse<{ token: string; user: User }>(response);
      if (data && data.token && data.user) {
        localStorage.setItem('authToken', data.token); // Store the token
        // The user object returned from backend should not include password/hashedPassword
        return data.user;
      }
      return null;
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error; // Re-throw to be caught by UI
    }
  },

  fetchCurrentUser: async (): Promise<User | null> => {
    // This would be called at app start if a token exists to validate session
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders(),
        });
        return await handleApiResponse<User | null>(response);
    } catch (error) {
        console.error("Failed to fetch current user:", error);
        localStorage.removeItem('authToken'); // Clear invalid token
        localStorage.removeItem('currentUser');
        return null;
    }
  },

  fetchUsersAdmin: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
    return handleApiResponse<User[]>(response);
  },

  addUserAdmin: async (userData: Omit<User, 'id' | 'hashedPassword'>): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleApiResponse<User>(response);
  },

  updateUserAdmin: async (userId: string, updates: Partial<Pick<User, 'username' | 'password' | 'role'>>): Promise<User | undefined> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleApiResponse<User | undefined>(response);
  },

  deleteUserAdmin: async (userIdToDelete: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/users/${userIdToDelete}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    // Assuming backend returns { success: true } or similar on successful delete
    const data = await handleApiResponse<{ success: boolean }>(response);
    return data.success;
  },

  // --- Categories ---
  fetchCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return handleApiResponse<Category[]>(response);
  },
  addCategoryAdmin: async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    return handleApiResponse<Category>(response);
  },
  updateCategoryAdmin: async (categoryData: Category): Promise<Category | undefined> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryData.id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    return handleApiResponse<Category | undefined>(response);
  },
  deleteCategoryAdmin: async (categoryId: string): Promise<{ success: boolean, message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<{ success: boolean, message?: string }>(response);
  },

  // --- Manufacturers ---
  fetchManufacturers: async (): Promise<Manufacturer[]> => {
    const response = await fetch(`${API_BASE_URL}/manufacturers`);
    return handleApiResponse<Manufacturer[]>(response);
  },
  addManufacturerAdmin: async (data: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
     const response = await fetch(`${API_BASE_URL}/manufacturers`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<Manufacturer>(response);
  },
  updateManufacturerAdmin: async (data: Manufacturer): Promise<Manufacturer | undefined> => {
    const response = await fetch(`${API_BASE_URL}/manufacturers/${data.id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleApiResponse<Manufacturer | undefined>(response);
  },
  deleteManufacturerAdmin: async (id: string): Promise<{ success: boolean, message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/manufacturers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<{ success: boolean, message?: string }>(response);
  },

  // --- Products ---
  // For POS view (filters by isVisible=true, category, search term)
  fetchProducts: async (query?: string, categoryId?: string): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (categoryId && categoryId !== "All Categories") params.append('categoryId', categoryId);
    
    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`); // No auth for public product listing
    return handleApiResponse<Product[]>(response);
  },

  fetchProductById: async (id: string): Promise<Product | undefined> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`); // No auth for public product detail
    return handleApiResponse<Product | undefined>(response);
  },

  // For Admin view (fetches all products regardless of visibility)
  fetchAllProductsAdmin: async (): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/products/admin`, { headers: getAuthHeaders() });
    return handleApiResponse<Product[]>(response);
  },

  addProductAdmin: async (productData: ProductFormData): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(productData), // ProductFormData is compatible, sizes is string
    });
    return handleApiResponse<Product>(response);
  },

  updateProductAdmin: async (productData: ProductFormData): Promise<Product | undefined> => {
    if (!productData.id) throw new Error("Product ID is required for update via API.");
    const response = await fetch(`${API_BASE_URL}/products/${productData.id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(productData), // ProductFormData is compatible
    });
    return handleApiResponse<Product | undefined>(response);
  },

  deleteProductAdmin: async (productId: string): Promise<boolean> => {
     const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await handleApiResponse<{ success: boolean }>(response);
    return data.success;
  },

  toggleProductVisibilityAdmin: async (productId: string): Promise<Product | undefined> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/toggle-visibility`, {
      method: 'PATCH', // Or PUT if you prefer for this kind of toggle
      headers: getAuthHeaders(),
    });
    return handleApiResponse<Product | undefined>(response);
  },
  
  // Used from POSForm after a sale to reduce stock
  updateStock: async (productId: string, sizeSold: string, quantitySold: number): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        // Backend needs to know which size and how much quantity to DECREMENT
        // This structure assumes the backend can handle decrementing.
        // Alternatively, fetch current stock, calculate new, then send new full stock.
        // Let's assume backend handles decrement logic with a negative quantity for sold items
        // Or, a more specific endpoint: /api/products/:id/sell
        body: JSON.stringify({ sizeName: sizeSold, newStock: -quantitySold, action: 'sell' }), // Backend interprets negative newStock as decrement or specific action
    });
    // Assuming backend returns { success: true } or the updated product
    const data = await handleApiResponse<{ success?: boolean, product?: Product }>(response);
    return data.success ?? (!!data.product);
  },

  // Used from InventoryStockEditModal to set absolute stock values for potentially multiple sizes
  updateProductStockAdmin: async (productId: string, sizeName: string | null, newStockValue: number | null, updatedSizesArray?: SizeStock[]): Promise<Product | undefined> => {
    let payload;
    if (updatedSizesArray) {
        payload = { updatedSizesArray }; // Send the whole array
    } else if (sizeName !== null && newStockValue !== null) {
        payload = { sizeName: sizeName, newStock: newStockValue }; // Send specific size update
    } else {
        throw new Error("Invalid parameters for updateProductStockAdmin");
    }

    const response = await fetch(`${API_BASE_URL}/products/${productId}/stock`, {
        method: 'PUT', // Could also be PATCH
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleApiResponse<Product | undefined>(response);
},


  duplicateProductAdmin: async (productId: string): Promise<Product | undefined> => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse<Product | undefined>(response);
  },

  // --- Sales ---
  submitSaleToHistory: async (saleItems: SaleItem[], totalAmount: number, paymentMethod: PaymentMethod, saleNotes?: string): Promise<SubmittedSale> => {
    const saleData = {
      items: saleItems.map((item): SaleItemRecord => ({ // Transform to SaleItemRecord structure if backend expects that
        productId: item.product.id,
        title: item.product.title,
        code: item.product.code,
        image: item.product.image,
        selectedSize: item.selectedSize,
        quantity: item.quantity,
        unitPrice: item.product.price,
        discount: item.discount,
        finalPrice: (item.product.price * item.quantity) - item.discount,
      })),
      totalAmount,
      paymentMethod,
      submissionDate: new Date().toISOString(), // Backend should ideally set this
      notes: saleNotes,
    };
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    return handleApiResponse<SubmittedSale>(response);
  },

  fetchSubmittedSales: async (): Promise<SubmittedSale[]> => {
    const response = await fetch(`${API_BASE_URL}/sales`, { headers: getAuthHeaders() });
    return handleApiResponse<SubmittedSale[]>(response);
  },

  updateSubmittedSale: async (updatedSaleData: SubmittedSale): Promise<SubmittedSale | undefined> => {
    const response = await fetch(`${API_BASE_URL}/sales/${updatedSaleData.id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSaleData),
    });
    return handleApiResponse<SubmittedSale | undefined>(response);
  },

  // This specific function for adjusting stock might be merged into updateProductStockAdmin
  // or handled by a more generic product update if the backend manages stock adjustments
  // based on sale edits. For now, keeping it separate if there's a direct admin need.
  adjustProductStockAdmin: async (_productId: string, _size: string, _quantityChange: number): Promise<Product | undefined> => {
     // This reuses the updateProductStockAdmin logic where quantityChange can be positive or negative
     // The backend's /products/:productId/stock endpoint should be designed to handle this.
     // Fetch current stock first, calculate new stock, then call updateProductStockAdmin
     // Or, the backend takes `quantityChange` and applies it.
     // For now, assume the backend's stock update can handle additive/subtractive changes or set absolute.
     // Let's simplify: this specific method may not be needed if updateProductStockAdmin is versatile.
     // It would call the same endpoint as updateProductStockAdmin.
     console.warn("adjustProductStockAdmin: Consider using updateProductStockAdmin with the new absolute stock value or ensuring backend supports delta changes.");
     // Example of how it might call if backend handles deltas:
    // const response = await fetch(`${API_BASE_URL}/products/${productId}/adjust-stock`, {
    //   method: 'PATCH',
    //   headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ sizeName: size, quantityChange }),
    // });
    // return handleApiResponse<Product | undefined>(response);
    return Promise.resolve(undefined); // Placeholder until backend logic is clear
  },
};
