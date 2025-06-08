
import React, { useState, useEffect, useCallback } from 'react';
import { SubmittedSale, Product } from '../../types';
import { productService } from '../../services/productService';
import { SalesHistoryTable } from './SalesHistoryTable';
import { SaleEditModal } from './SaleEditModal';
import { useLanguage } from '../../contexts/LanguageContext';

export const SalesHistoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState<SubmittedSale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null); // For save/load errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<SubmittedSale | null>(null);
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);


  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  };

  const loadSalesAndProducts = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const [fetchedSales, fetchedProducts] = await Promise.all([
        productService.fetchSubmittedSales(),
        productService.fetchAllProductsAdmin() 
      ]);
      setSales(fetchedSales);
      setAllProducts(fetchedProducts);
    } catch (err) {
      console.error("Failed to load sales history or product data:", err);
      setActionError(t('errors.failedToLoadData', { entity: t('adminPage.tabSalesHistory').toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSalesAndProducts();
  }, [loadSalesAndProducts]);

  const handleOpenEditModal = (sale: SubmittedSale) => {
    clearMessages();
    setEditingSale(sale);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSale(null);
  };

  const handleSaveSale = async (updatedSaleData: SubmittedSale) => {
    clearMessages();
    if (!editingSale) return;
    setIsLoading(true); // Indicate loading during save

    try {
      const updatedSale = await productService.updateSubmittedSale(updatedSaleData);
      if (updatedSale) {
        // The backend should handle any related stock adjustments if quantities change.
        // The frontend only sends the updated sale data.
        setSuccessMessage(`Sale ${updatedSale.id.substring(updatedSale.id.length - 8)} ${t('common.edit', {count: 1}).toLowerCase()} ${t('common.success')}!`);
        await loadSalesAndProducts(); // Reload sales and products to reflect any changes
      } else {
        throw new Error(t('errors.apiErrorGeneric', { message: "Update operation returned undefined."}));
      }
      handleCloseEditModal();
    } catch (err) {
      console.error("Error updating sale:", err);
      setActionError(`${t('errors.failedToLoadData', { entity: 'sale' })}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
        setIsLoading(false);
    }
  };

  const MessageDisplay = () => {
    if (actionError) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4">{actionError}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  };

  if (isLoading && sales.length === 0) {
    return <p className="text-center text-gray-500 py-8">{t('common.loading')} {t('adminPage.tabSalesHistory').toLowerCase()}...</p>;
  }


  return (
    <div className="space-y-6">
      <MessageDisplay />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">{t('adminPage.tabSalesHistory')}</h2>
      </div>

      {isLoading && sales.length > 0 && <p className="text-center text-gray-500 py-4">{t('common.loading')}...</p>}
      
      {!isLoading && actionError && sales.length === 0 && (
         <p className="text-center text-red-500 py-8 border-2 border-dashed border-red-300 rounded-md">
           {actionError}
         </p>
      )}

      {!isLoading && !actionError && sales.length === 0 && (
         <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">
           {t('placeholders.noSalesFound')}
         </p>
      )}

      {!actionError && sales.length > 0 && (
        <SalesHistoryTable
          sales={sales}
          onEdit={handleOpenEditModal}
        />
      )}

      {isEditModalOpen && editingSale && (
        <SaleEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveSale}
          sale={editingSale}
          allProducts={allProducts} 
          key={editingSale.id}
        />
      )}
    </div>
  );
};
