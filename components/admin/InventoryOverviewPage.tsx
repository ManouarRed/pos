
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SizeStock } from '../../types';
import { productService } from '../../services/productService';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SearchIcon } from '../icons/SearchIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { InventoryStockEditModal } from './InventoryStockEditModal';
import { useLanguage } from '../../contexts/LanguageContext';

const LOW_STOCK_THRESHOLD = 10;
type StockFilterType = 'all' | 'inStock' | 'lowStock' | 'outOfStock';

export const InventoryOverviewPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null); // Combined error state for loading and actions
  const [searchTermInventory, setSearchTermInventory] = useState<string>('');
  const [activeStockFilter, setActiveStockFilter] = useState<StockFilterType>('all');

  const [isStockEditModalOpen, setIsStockEditModalOpen] = useState<boolean>(false);
  const [productForStockEdit, setProductForStockEdit] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const adminProducts = await productService.fetchAllProductsAdmin();
      setProducts(adminProducts);
    } catch (err) {
      console.error("Failed to load products for inventory:", err);
      setActionError(t('errors.failedToLoadData', { entity: t('common.inventory') }));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const searchedProducts = useMemo(() => {
    if (!searchTermInventory) {
      return products;
    }
    const lowerSearchTerm = searchTermInventory.toLowerCase();
    return products.filter(product =>
      product.title.toLowerCase().includes(lowerSearchTerm) ||
      product.code.toLowerCase().includes(lowerSearchTerm)
    );
  }, [products, searchTermInventory]);

  const filteredInventoryProducts = useMemo(() => {
    let productsToFilter = [...searchedProducts];
    switch (activeStockFilter) {
      case 'inStock':
        return productsToFilter.filter(p => (p.totalStock ?? 0) > 0);
      case 'lowStock':
        return productsToFilter.filter(p => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= LOW_STOCK_THRESHOLD);
      case 'outOfStock':
        return productsToFilter.filter(p => (p.totalStock ?? 0) === 0);
      case 'all':
      default:
        return productsToFilter;
    }
  }, [searchedProducts, activeStockFilter]);

  const inventorySummary = useMemo(() => {
    const currentProductList = searchedProducts;
    const totalProducts = currentProductList.length;
    const productsInStockCount = currentProductList.filter(p => (p.totalStock ?? 0) > 0).length;
    const outOfStockCount = currentProductList.filter(p => (p.totalStock ?? 0) === 0).length;
    const lowStockCount = currentProductList.filter(p => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= LOW_STOCK_THRESHOLD).length;
    return { totalProducts, productsInStockCount, outOfStockCount, lowStockCount };
  }, [searchedProducts]);

  const getStockLevelClass = (totalStock: number): string => {
    if (totalStock === 0) return 'text-red-600 font-semibold';
    if (totalStock <= LOW_STOCK_THRESHOLD) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const handleOpenStockEditModal = (product: Product) => {
    clearMessages();
    setProductForStockEdit(product);
    setIsStockEditModalOpen(true);
  };

  const handleCloseStockEditModal = () => {
    setProductForStockEdit(null);
    setIsStockEditModalOpen(false);
  };

  const handleSaveStockChangesFromModal = async (productId: string, updatedSizeStocks: SizeStock[]) => {
    clearMessages();
    // Use a specific loading state for this action if needed, or rely on main isLoading
    // For simplicity, main isLoading is not set here, but for better UX you might.
    try {
        // Backend expects the entire updatedSizesArray for the product
        const updatedProduct = await productService.updateProductStockAdmin(productId, null, null, updatedSizeStocks);
        if (updatedProduct) {
            setSuccessMessage(t('inventory.stockUpdateSuccessPlural', { count: updatedSizeStocks.length }));
            await loadProducts(); // Refresh product list
        } else {
            throw new Error("Stock update operation returned no product data.");
        }
    } catch (err) {
        console.error(`Error updating stock for ${productId}:`, err);
        setActionError(t('inventory.stockUpdateError', { errorCount: updatedSizeStocks.length, successCount: 0 }));
    } finally {
        // Potentially stop a specific loading indicator here
        handleCloseStockEditModal();
    }
  };


  const handleClearSearchAndFilters = () => {
    setSearchTermInventory('');
    setActiveStockFilter('all');
    clearMessages();
  };

  const renderFilterCard = (titleKey: string, count: number, filterType: StockFilterType, colorScheme: string) => {
    const isActive = activeStockFilter === filterType;
    return (
      <div
        onClick={() => setActiveStockFilter(filterType)}
        className={`p-4 rounded-lg shadow cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105
                    ${isActive ? `ring-2 ring-offset-2 ${colorScheme}-ring border-2 ${colorScheme}-border bg-opacity-100 ${colorScheme}-bg-active` 
                               : `bg-opacity-80 hover:bg-opacity-100 ${colorScheme}-bg`}
                   `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setActiveStockFilter(filterType)}
        aria-pressed={isActive}
        aria-label={`${t(titleKey)}, ${count} products`}
      >
        <p className={`text-sm font-medium ${colorScheme}-text`}>{t(titleKey)}</p>
        <p className={`text-2xl font-bold ${colorScheme}-text-dark`}>{count}</p>
      </div>
    );
  }

  const MessageDisplay = () => {
    if (actionError) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4">{actionError}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  };

  if (isLoading && products.length === 0) {
    return <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>;
  }
  
  return (
    <div className="space-y-6">
      <MessageDisplay />
      <h2 className="text-2xl font-semibold text-gray-800">{t('adminPage.tabInventory')}</h2>

      <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label={t('inventory.searchLabel')}
            id="inventorySearch"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchTermInventory}
            onChange={(e) => setSearchTermInventory(e.target.value)}
            containerClassName="w-full md:col-span-2"
            leftIcon={<SearchIcon className="w-4 h-4 text-gray-400" />}
          />
          <Button
            onClick={handleClearSearchAndFilters}
            variant="secondary"
            size="md"
            disabled={!searchTermInventory && activeStockFilter === 'all'}
            className="w-full md:w-auto"
          >
            {t('inventory.clearSearchAndFilters')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {renderFilterCard('inventory.totalProductsCard', inventorySummary.totalProducts, 'all', 'indigo')}
        {renderFilterCard('inventory.inStockCard', inventorySummary.productsInStockCount, 'inStock', 'green')}
        {renderFilterCard('inventory.lowStockCard', inventorySummary.lowStockCount, 'lowStock', 'orange')}
        {renderFilterCard('inventory.outOfStockCard', inventorySummary.outOfStockCount, 'outOfStock', 'red')}
      </div>
      
      <style>{`
        .indigo-bg { background-color: #eef2ff; } .indigo-bg-active { background-color: #c7d2fe; } .indigo-text { color: #4338ca; } .indigo-text-dark { color: #3730a3; } .indigo-ring { ring-color: #4f46e5; } .indigo-border { border-color: #6366f1; }
        .green-bg { background-color: #f0fdf4; } .green-bg-active { background-color: #dcfce7; } .green-text { color: #166534; } .green-text-dark { color: #15803d; } .green-ring { ring-color: #22c55e; } .green-border { border-color: #4ade80; }
        .orange-bg { background-color: #fff7ed; } .orange-bg-active { background-color: #ffedd5; } .orange-text { color: #c2410c; } .orange-text-dark { color: #ea580c; } .orange-ring { ring-color: #f97316; } .orange-border { border-color: #fb923c; }
        .red-bg { background-color: #fef2f2; } .red-bg-active { background-color: #fee2e2; } .red-text { color: #b91c1c; } .red-text-dark { color: #dc2626; } .red-ring { ring-color: #ef4444; } .red-border { border-color: #f87171; }
      `}</style>

      {isLoading && products.length > 0 && <p className="text-center text-gray-500 py-4">{t('common.loading')}...</p>}

      {actionError && products.length === 0 && <p className="text-center text-red-500 py-8 border-2 border-dashed border-red-300 rounded-md">{actionError}</p>}

      {filteredInventoryProducts.length === 0 && !isLoading && !actionError ? (
        <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">
          {searchTermInventory || activeStockFilter !== 'all' ? t('inventory.noProductsMatchFilters') : t('inventory.noProducts')}
        </p>
      ) : !actionError && ( // Only render table if no major loading error
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300" aria-label={t('inventory.tableAriaLabel')}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{t('common.productTitle')}</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('common.code')}</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('common.category')}</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('common.manufacturer')}</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{t('inventory.totalStock')}</th>
                      <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredInventoryProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{product.title}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.code}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.categoryName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.manufacturerName}</td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm ${getStockLevelClass(product.totalStock ?? 0)}`}>
                          {product.totalStock ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStockEditModal(product)}
                            leftIcon={<PencilIcon className="w-4 h-4" />}
                            disabled={product.sizes.length === 0}
                            title={product.sizes.length === 0 ? t('inventory.noSizesDefined') : t('inventory.editStockForAllSizes')}
                          >
                            {t('inventory.editStockButton')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {isStockEditModalOpen && productForStockEdit && (
        <InventoryStockEditModal
          isOpen={isStockEditModalOpen}
          onClose={handleCloseStockEditModal}
          onSave={handleSaveStockChangesFromModal}
          product={productForStockEdit}
        />
      )}
    </div>
  );
};
