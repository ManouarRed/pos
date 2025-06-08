
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Product, ProductFormData, Category, Manufacturer, SizeStock } from '../../types';
import { productService } from '../../services/productService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ProductTable } from './ProductTable';
import { PlusIcon } from '../icons/PlusIcon';
import { UploadIcon } from '../icons/UploadIcon'; 
import { DownloadIcon } from '../icons/DownloadIcon'; 
import { SearchIcon } from '../icons/SearchIcon'; 
import { ProductFormModal } from './ProductFormModal';
import { ProductBulkEditModal } from './ProductBulkEditModal'; 
import { FilterIcon } from '../icons/FilterIcon';
import { SortAscIcon } from '../icons/SortAscIcon';
import { SortDescIcon } from '../icons/SortDescIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { useLanguage } from '../../contexts/LanguageContext';


const ALL_FILTER_VALUE = "ALL";

export const ProductManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Main loading for products list
  const [actionError, setActionError] = useState<string | null>(null); // For errors from actions like save, delete
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState(ALL_FILTER_VALUE);
  const [filterManufacturerId, setFilterManufacturerId] = useState(ALL_FILTER_VALUE);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'totalStock'; direction: 'ascending' | 'descending' } | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState<boolean>(true); // Separate loading for filter dropdowns


  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState<boolean>(false);

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  }

  const loadProducts = useCallback(async (calledByAction?: boolean) => {
    setIsLoading(true);
    // Only clear messages if loadProducts is not part of an action that just set a message.
    // However, if loadProducts itself fails, it should set an error.
    // This logic is now simplified: loadProducts doesn't clear messages.
    // Action initiators clear messages before starting the action.
    try {
      const adminProducts = await productService.fetchAllProductsAdmin();
      setProducts(adminProducts);
      // If loadProducts was successful and not part of an action that would set its own message,
      // we can clear any previous loading errors.
      if (!calledByAction) { 
        // Potentially clear only loading-specific errors if distinguished, or clear general actionError if appropriate.
        // For now, if an action just completed, its message should persist. If this is a general refresh, clear stale errors.
        // This is tricky. Let's assume for now that messages are managed by the actions themselves.
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      // Set an error message if loading products fails. This might overwrite a previous success/error.
      setActionError(t('errors.failedToLoadData', { entity: t('adminPage.tabProducts').toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const loadFilterData = useCallback(async () => {
    setIsLoadingFilters(true);
    // Do not clear actionError here if it's from a product load failure.
    // This only loads filter dropdowns.
    try {
      const [fetchedCategories, fetchedManufacturers] = await Promise.all([
        productService.fetchCategories(),
        productService.fetchManufacturers()
      ]);
      setCategories(fetchedCategories);
      setManufacturers(fetchedManufacturers);
    } catch (err) {
      console.error("Failed to load categories or manufacturers for filtering:", err);
      // Append to existing error or set new if none.
      const filterError = t('errors.failedToLoadData', { entity: "filter options" });
      setActionError(prevError => prevError ? `${prevError} ${filterError}` : filterError);
    } finally {
      setIsLoadingFilters(false);
    }
  }, [t]);

  useEffect(() => {
    clearMessages(); // Clear messages on initial mount / page load
    loadProducts();
    loadFilterData();
  }, [loadProducts, loadFilterData]); // loadProducts and loadFilterData are stable due to useCallback

  const handleOpenAddModal = () => {
    clearMessages();
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    clearMessages();
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (formData: ProductFormData) => {
    clearMessages();
    setIsLoading(true); 
    try {
      if (editingProduct && formData.id) {
        const updatedProduct = await productService.updateProductAdmin(formData as Required<ProductFormData>); 
        if (updatedProduct) {
          setSuccessMessage(t('common.success') + ": " + t('common.productTitle') + " " + t('common.edit', { count: 1 }).toLowerCase() + "!");
        } else {
          throw new Error(t('errors.apiErrorGeneric', { message: "Update operation returned undefined."}));
        }
      } else { 
        await productService.addProductAdmin(formData);
        setSuccessMessage(t('common.success') + ": " + t('common.productTitle') + " " + t('common.add', { count: 1 }).toLowerCase() + "!");
      }
      await loadProducts(true); 
      handleCloseModal();
    } catch (err) {
      console.error("Error saving product:", err);
      setActionError(`${t('errors.failedToLoadData', { entity: t('common.productTitle').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    clearMessages();
    if (window.confirm(t('common.confirm') + " " + t('common.delete').toLowerCase() + " " + t('common.productTitle').toLowerCase() + "? " + t('common.cannotBeUndone'))) {
      setIsLoading(true);
      try {
        const success = await productService.deleteProductAdmin(productId);
        if (success) {
          setSuccessMessage(t('common.success') + ": " + t('common.productTitle') + " " + t('common.delete', { count: 1 }).toLowerCase() + "!");
          await loadProducts(true); 
        } else {
          setActionError(t('errors.failedToLoadData', { entity: t('common.productTitle').toLowerCase() }) + ". " + t('errors.apiErrorGeneric', { message: "Product might not exist."}));
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        setActionError(`${t('errors.failedToLoadData', { entity: t('common.productTitle').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
          setIsLoading(false);
      }
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    clearMessages();
    setIsLoading(true);
    try {
      const updatedProduct = await productService.toggleProductVisibilityAdmin(product.id);
      if (updatedProduct) {
        setSuccessMessage(t('common.success') + `: ${t('common.visibility')} for "${updatedProduct.title}" ${t('common.edit', { count: 1 }).toLowerCase()}.`);
        await loadProducts(true); 
      } else {
        throw new Error(t('errors.apiErrorGeneric', { message: "Toggle visibility operation returned undefined."}));
      }
    } catch (err) {
      console.error("Error toggling visibility:", err);
      setActionError(`${t('errors.failedToLoadData', { entity: `${t('common.productTitle').toLowerCase()} ${t('common.visibility').toLowerCase()}` })}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDuplicateProduct = async (productToDuplicate: Product) => {
    clearMessages();
    if (window.confirm(t('common.confirm') + ` ${t('common.duplicate').toLowerCase()} "${productToDuplicate.title}"?`)) {
      setIsLoading(true);
      try {
        const duplicatedProduct = await productService.duplicateProductAdmin(productToDuplicate.id);
        if (duplicatedProduct) {
          setSuccessMessage(t('common.success') + `: "${productToDuplicate.title}" ${t('common.duplicate', { count: 1 }).toLowerCase()} as "${duplicatedProduct.title}".`);
          await loadProducts(true); 
        } else {
          throw new Error(t('errors.apiErrorGeneric', { message: "Duplicate operation returned undefined."}));
        }
      } catch (err) {
        console.error("Error duplicating product:", err);
        setActionError(`${t('errors.failedToLoadData', { entity: t('common.productTitle').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
          setIsLoading(false);
      }
    }
  };

  const handleExportProducts = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      const productsToExport = filteredAndSortedProducts; 
      if(productsToExport.length === 0) {
        setActionError(t('placeholders.noProductsFound') + " to export.");
        setIsLoading(false);
        return;
      }
      const worksheetData = productsToExport.map(p => ({
        ID: p.code, // Changed p.id to p.code
        Title: p.title,
        Code: p.code,
        Category: p.categoryName || p.categoryId,
        Manufacturer: p.manufacturerName || p.manufacturerId,
        Price: p.price,
        TotalStock: p.totalStock ?? 0,
        SizesStockJSON: JSON.stringify(p.sizes), // Export remains JSON
        'Image URL': p.image,
        'Is Visible': p.isVisible ? t('common.yes') : t('common.no'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, `ProductsExport_${new Date().toISOString().slice(0,10)}.xlsx`);
      setSuccessMessage(t('common.success') + "! " + t('adminPage.tabProducts') + " exported.");
    } catch (err) {
      console.error("Error exporting products:", err);
      setActionError(`${t('errors.failedToLoadData', { entity: t('adminPage.tabProducts').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportProductsClick = () => {
    clearMessages();
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages(); 
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      let importSuccessful = false;
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File data could not be read.");
        
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          setActionError(t('errors.apiErrorGeneric', {message: "The imported file is empty or not formatted correctly."}));
          setIsLoading(false);
          if(fileInputRef.current) fileInputRef.current.value = ""; 
          return;
        }
        
        const currentCategories = categories.length > 0 ? categories : await productService.fetchCategories();
        const currentManufacturers = manufacturers.length > 0 ? manufacturers : await productService.fetchManufacturers();
        const existingSystemProducts = products.length > 0 ? products : await productService.fetchAllProductsAdmin(); 

        setCategories(currentCategories); 
        setManufacturers(currentManufacturers);

        const categoryMap = new Map(currentCategories.map(c => [c.name.toLowerCase(), c.id]));
        const manufacturerMap = new Map(currentManufacturers.map(m => [m.name.toLowerCase(), m.id]));
        const productCodeMap = new Map(existingSystemProducts.map(p => [p.code.toLowerCase(), p]));

        let importedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowIndex = i + 2; 

          if (!row.Title || !row.Code || row.Price == null || !row.Category || !row.Manufacturer || !row['Image URL']) {
            errors.push(`Row ${rowIndex}: Missing required fields (Title, Code, Price, Category, Manufacturer, Image URL).`);
            continue;
          }

          const categoryId = categoryMap.get(String(row.Category).toLowerCase());
          if (!categoryId) {
            errors.push(`Row ${rowIndex}: Category "${row.Category}" not found.`);
            continue;
          }
          const manufacturerId = manufacturerMap.get(String(row.Manufacturer).toLowerCase());
          if (!manufacturerId) {
            errors.push(`Row ${rowIndex}: Manufacturer "${row.Manufacturer}" not found.`);
            continue;
          }

          const price = parseFloat(row.Price);
          if (isNaN(price) || price <= 0) {
            errors.push(`Row ${rowIndex}: Invalid Price "${row.Price}". Must be a positive number.`);
            continue;
          }
          
          let sizesString: string;
          const sizesStockJSONFromRow = row.SizesStockJSON ? String(row.SizesStockJSON).trim() : '';
          const sizesListFromRow = row.Sizes ? String(row.Sizes).trim() : ''; // New "Sizes" column
          const stocksListFromRow = row.Stocks ? String(row.Stocks).trim() : ''; // New "Stocks" column

          if (sizesStockJSONFromRow) {
              sizesString = sizesStockJSONFromRow;
              try {
                  const parsed = JSON.parse(sizesString);
                  if (!Array.isArray(parsed) || !parsed.every((s: any) => typeof s.size === 'string' && typeof s.stock === 'number' && s.stock >= 0)) {
                      errors.push(`Row ${rowIndex}: 'SizesStockJSON' ("${sizesString}") is not a valid array of {size: string, stock: number (>=0)}.`);
                      continue;
                  }
              } catch (jsonError) {
                  errors.push(`Row ${rowIndex}: 'SizesStockJSON' ("${sizesString}") is not valid JSON. ${jsonError}`);
                  continue;
              }
          } else if (sizesListFromRow && stocksListFromRow) {
              const sizeNamesArray = sizesListFromRow.split(',').map(s => s.trim());
              const stockValuesArray = stocksListFromRow.split(',').map(s => parseInt(s.trim(), 10));

              if (sizeNamesArray.length !== stockValuesArray.length) {
                  errors.push(`Row ${rowIndex}: Mismatch between number of sizes (${sizeNamesArray.length}) in "Sizes" and stock values (${stockValuesArray.length}) in "Stocks".`);
                  continue;
              }

              const sizeStockArray: SizeStock[] = [];
              let parsingError = false;
              for (let j = 0; j < sizeNamesArray.length; j++) {
                  const sizeName = sizeNamesArray[j];
                  const stockValue = stockValuesArray[j];
                  if (!sizeName) {
                      errors.push(`Row ${rowIndex}: Empty size name found at position ${j + 1} in "Sizes" column.`);
                      parsingError = true;
                      break;
                  }
                  if (isNaN(stockValue)) {
                      errors.push(`Row ${rowIndex}: Stock value for size "${sizeName}" is not a valid number ("${stocksListFromRow.split(',')[j]?.trim()}").`);
                      parsingError = true;
                      break;
                  }
                  if (stockValue < 0) {
                      errors.push(`Row ${rowIndex}: Stock value for size "${sizeName}" (${stockValue}) cannot be negative.`);
                      parsingError = true;
                      break;
                  }
                  sizeStockArray.push({ size: sizeName, stock: stockValue });
              }

              if (parsingError) {
                  continue;
              }
              sizesString = JSON.stringify(sizeStockArray);
          } else {
              const totalStockFromRow = row.TotalStock !== undefined ? parseInt(String(row.TotalStock), 10) : (row.Stock !== undefined ? parseInt(String(row.Stock), 10) : undefined);
              if (totalStockFromRow !== undefined && !isNaN(totalStockFromRow) && totalStockFromRow >= 0) {
                  sizesString = JSON.stringify([{ size: 'One Size', stock: totalStockFromRow }]);
              } else {
                  errors.push(`Row ${rowIndex}: Missing 'SizesStockJSON' or 'Sizes'/'Stocks' columns, or valid 'TotalStock'/'Stock'. Product will have no stock/sizes defined.`);
                  sizesString = '[]';
              }
          }


          const productData: ProductFormData = {
            title: String(row.Title),
            code: String(row.Code),
            price: price,
            categoryId: categoryId,
            manufacturerId: manufacturerId,
            sizes: sizesString, 
            image: String(row['Image URL']),
            isVisible: row['Is Visible'] ? String(row['Is Visible']).toLowerCase() === 'yes' || String(row['Is Visible']).toLowerCase() === 'true' : true,
          };
          
          const existingProductByCode = productCodeMap.get(productData.code.toLowerCase());
          
          try {
            if (existingProductByCode) {
              await productService.updateProductAdmin({ ...productData, id: existingProductByCode.id });
              updatedCount++;
            } else {
              await productService.addProductAdmin(productData);
              importedCount++;
            }
          } catch (prodServiceError) {
             errors.push(`Row ${rowIndex} (Code: ${productData.code}): Error processing - ${prodServiceError instanceof Error ? prodServiceError.message : String(prodServiceError)}`);
          }
        }
        
        let summaryMessage = "";
        if (importedCount > 0) summaryMessage += `${importedCount} products imported. `;
        if (updatedCount > 0) summaryMessage += `${updatedCount} products updated. `;
        
        if (errors.length > 0) {
          setActionError(`Import completed with errors. ${summaryMessage} See details below:\n- ${errors.join('\n- ')}`);
        } else if (summaryMessage) {
          setSuccessMessage(`Import successful! ${summaryMessage}`);
          importSuccessful = true;
        } else {
          setActionError("No products were imported or updated. Check file format or content.");
        }

      } catch (err) {
        console.error("Error importing products:", err);
        setActionError(`${t('errors.failedToLoadData', { entity: t('adminPage.tabProducts').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        await loadProducts(true); // Refresh the list, pass true to indicate it's part of an action
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let processedProducts = [...products];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedProducts = processedProducts.filter(p =>
        p.title.toLowerCase().includes(lowerSearchTerm) ||
        p.code.toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (filterCategoryId !== ALL_FILTER_VALUE) {
      processedProducts = processedProducts.filter(p => p.categoryId === filterCategoryId);
    }
    if (filterManufacturerId !== ALL_FILTER_VALUE) {
      processedProducts = processedProducts.filter(p => p.manufacturerId === filterManufacturerId);
    }
    if (sortConfig !== null) {
      processedProducts.sort((a, b) => {
        let valA = a[sortConfig.key as keyof Product];
        let valB = b[sortConfig.key as keyof Product];
        if (sortConfig.key === 'totalStock') {
          valA = a.totalStock ?? 0;
          valB = b.totalStock ?? 0;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA == null) valA = ''; 
        if (valB == null) valB = '';

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return processedProducts;
  }, [products, searchTerm, filterCategoryId, filterManufacturerId, sortConfig]);

  const requestSort = (key: keyof Product | 'totalStock') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Product | 'totalStock') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <SortAscIcon className="w-3 h-3 text-gray-400 opacity-50 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'ascending' ? <SortAscIcon className="w-4 h-4 text-indigo-600" /> : <SortDescIcon className="w-4 h-4 text-indigo-600" />;
  };

  const handleClearFilters = () => {
    clearMessages();
    setSearchTerm('');
    setFilterCategoryId(ALL_FILTER_VALUE);
    setFilterManufacturerId(ALL_FILTER_VALUE);
    setSortConfig(null);
  };

  const categoryOptions = [{ value: ALL_FILTER_VALUE, label: t('common.all') + " " + t('common.category', { count: 2 }) }, ...categories.map(c => ({ value: c.id, label: c.name }))];
  const manufacturerOptions = [{ value: ALL_FILTER_VALUE, label: t('common.all') + " " + t('common.manufacturer', { count: 2 }) }, ...manufacturers.map(m => ({ value: m.id, label: m.name }))];

  const handleSelectProduct = (productId: string, isSelected: boolean) => {
    setSelectedProductIds(prev =>
      isSelected ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAllProducts = (isSelected: boolean) => {
    setSelectedProductIds(isSelected ? filteredAndSortedProducts.map(p => p.id) : []);
  };

  const handleBulkDeleteSelected = async () => {
    clearMessages();
    if (selectedProductIds.length === 0) {
      setActionError(t('placeholders.noData') + " selected for deletion."); 
      return;
    }
    if (window.confirm(t('common.confirm') + ` ${t('common.delete').toLowerCase()} ${selectedProductIds.length} selected product(s)? ${t('common.cannotBeUndone')}`)) {
      setIsLoading(true);
      let successCount = 0;
      const errors: string[] = [];
      for (const productId of selectedProductIds) {
        try {
          const success = await productService.deleteProductAdmin(productId);
          if (success) successCount++;
          else errors.push(`Product ID ${productId} not found or not deleted by server.`);
        } catch (err) {
          console.error(`Error deleting product ${productId}:`, err);
          errors.push(`Product ID ${productId}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      let message = "";
      if (successCount > 0) message += `${successCount} product(s) ${t('common.delete', {count: successCount}).toLowerCase()} successfully. `;
      if (errors.length > 0) {
          message += `${errors.length} product(s) failed to delete. Details: ${errors.join(', ')}`;
          setActionError(message);
      } else if (successCount > 0) {
          setSuccessMessage(message);
      } else {
          setActionError("Bulk deletion processed, but no products were confirmed deleted by the server.");
      }
      await loadProducts(true); 
      setSelectedProductIds([]);
      setIsLoading(false);
    }
  };

  const handleOpenBulkEditModal = () => {
    clearMessages();
    if (selectedProductIds.length === 0) {
      setActionError(t('placeholders.noData') + " selected for bulk editing.");
      return;
    }
    setIsBulkEditModalOpen(true);
  };

  const handleCloseBulkEditModal = () => {
    setIsBulkEditModalOpen(false);
  };

  const handleBulkEditSave = async (updates: {
    categoryId?: string;
    manufacturerId?: string;
    isVisible?: boolean;
  }) => {
    clearMessages();
    setIsLoading(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const productId of selectedProductIds) {
      try {
        const productToUpdate = products.find(p => p.id === productId);
        if (productToUpdate) {
          const formData: ProductFormData = {
            id: productToUpdate.id,
            title: productToUpdate.title,
            code: productToUpdate.code,
            price: productToUpdate.price,
            image: productToUpdate.image,
            sizes: JSON.stringify(productToUpdate.sizes), 
            categoryId: updates.categoryId !== undefined ? updates.categoryId : productToUpdate.categoryId,
            manufacturerId: updates.manufacturerId !== undefined ? updates.manufacturerId : productToUpdate.manufacturerId,
            isVisible: updates.isVisible !== undefined ? updates.isVisible : productToUpdate.isVisible,
          };
          const updated = await productService.updateProductAdmin(formData);
          if (updated) successCount++;
          else errors.push(`Product ID ${productId}: Update returned no data.`);
        } else {
          errors.push(`Product ID ${productId} not found for update.`);
        }
      } catch (err) {
        console.error(`Error bulk editing product ${productId}:`, err);
        errors.push(`Product ID ${productId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
        
    let message = "";
    if (successCount > 0) message += `${successCount} product(s) ${t('common.edit', {count: successCount}).toLowerCase()} successfully. `;
    if (errors.length > 0) {
        message += `${errors.length} product(s) failed to update. Details: ${errors.join(', ')}`;
        setActionError(message);
    } else if (successCount > 0) {
        setSuccessMessage(message);
    } else {
        setActionError("Bulk edit processed, but no products were confirmed updated by the server.");
    }
    
    await loadProducts(true);
    setSelectedProductIds([]);
    setIsBulkEditModalOpen(false);
    setIsLoading(false);
  };

  const MessageDisplay = () => {
    if (actionError) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4 whitespace-pre-wrap">{actionError}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  };

  if (isLoading && products.length === 0 && !actionError && !successMessage) { // Only show main loading if no other message is more relevant
    return <p className="text-center text-gray-500 py-8">{t('common.loading')}...</p>;
  }

  return (
    <div className="space-y-6">
      <MessageDisplay />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">{t('adminPage.tabProducts')}</h2>
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" aria-hidden="true" />
          <Button onClick={handleImportProductsClick} variant="secondary" leftIcon={<UploadIcon />} disabled={isLoading}>{isLoading ? t('common.loading') : t('common.import')} (XLSX)</Button>
          <Button onClick={handleExportProducts} variant="secondary" leftIcon={<DownloadIcon />} disabled={isLoading || filteredAndSortedProducts.length === 0 }>{isLoading ? t('common.loading') : t('common.export')} (XLSX)</Button>
          <Button onClick={handleOpenAddModal} variant="primary" leftIcon={<PlusIcon />} disabled={isLoading}>{t('common.addNew')} {t('common.productTitle').toLowerCase()}</Button>
        </div>
      </div>
      
      {selectedProductIds.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm font-medium text-indigo-700">
            {selectedProductIds.length} product(s) selected.
          </p>
          <div className="flex space-x-2">
            <Button onClick={handleOpenBulkEditModal} variant="secondary" size="sm" leftIcon={<PencilIcon className="w-4 h-4"/>} disabled={isLoading}>
              {t('common.bulkEdit')}
            </Button>
            <Button onClick={handleBulkDeleteSelected} variant="danger" size="sm" leftIcon={<TrashIcon className="w-4 h-4"/>} disabled={isLoading}>
              {t('common.deleteSelected')}
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label={t('common.search') + ` (${t('common.title')}, ${t('common.code')})`}
            id="productSearch"
            placeholder={t('common.search') + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="w-full"
            leftIcon={<SearchIcon className="w-4 h-4 text-gray-400"/>}
          />
           {isLoadingFilters ? <p className="text-sm text-gray-500">{t('common.loading')} filters...</p> : (
            <>
              <Select
                label={t('common.filterBy') + " " + t('common.category').toLowerCase()}
                id="categoryFilter"
                options={categoryOptions}
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                containerClassName="w-full"
                disabled={categories.length === 0}
              />
              <Select
                label={t('common.filterBy') + " " + t('common.manufacturer').toLowerCase()}
                id="manufacturerFilter"
                options={manufacturerOptions}
                value={filterManufacturerId}
                onChange={(e) => setFilterManufacturerId(e.target.value)}
                containerClassName="w-full"
                disabled={manufacturers.length === 0}
              />
            </>
           )}
          <div className="flex flex-col space-y-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.sortBy')}</label>
            <div className="flex flex-wrap gap-2">
              {(['title', 'price', 'totalStock'] as const).map(key => (
                <Button
                  key={key}
                  variant={sortConfig?.key === key ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => requestSort(key)}
                  rightIcon={getSortIcon(key)}
                  className="flex-grow capitalize"
                >
                  {key === 'totalStock' ? t('common.stock') : t(key as any)}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={handleClearFilters} variant="ghost" size="sm" disabled={isLoading || (!searchTerm && filterCategoryId === ALL_FILTER_VALUE && filterManufacturerId === ALL_FILTER_VALUE && !sortConfig)}>
                {t('common.clearFiltersAndSort')}
            </Button>
        </div>
      </div>
      
      {isLoading && products.length > 0 && <p className="text-center text-gray-500 py-4">{t('common.loading')} {t('adminPage.tabProducts').toLowerCase()}...</p>}
      
      <ProductTable
        products={filteredAndSortedProducts}
        selectedProductIds={selectedProductIds}
        onSelectProduct={handleSelectProduct}
        onSelectAllProducts={handleSelectAllProducts}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProduct}
        onToggleVisibility={handleToggleVisibility}
        onDuplicate={handleDuplicateProduct}
      />

      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          product={editingProduct}
          key={editingProduct ? editingProduct.id : 'new-product-modal'} 
        />
      )}
       {isBulkEditModalOpen && (
        <ProductBulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={handleCloseBulkEditModal}
          onSave={handleBulkEditSave}
          categories={categories}
          manufacturers={manufacturers}
          productsCount={selectedProductIds.length}
        />
      )}
    </div>
  );
};
