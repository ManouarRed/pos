
import React, { useState, useEffect, useCallback } from 'react';
import { Category } from '../../types';
import { productService } from '../../services/productService';
import { Button } from '../common/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { CategoryTable } from './CategoryTable';
import { CategoryFormModal } from './CategoryFormModal';
import { useLanguage } from '../../contexts/LanguageContext';

export const CategoryManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null); // For save/delete errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  }

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    clearMessages(); // Clear messages on reload
    try {
      const fetchedCategories = await productService.fetchCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setActionError(t('errors.failedToLoadData', { entity: t('common.category', {count: 2}).toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenAddModal = () => {
    clearMessages();
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    clearMessages();
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (categoryData: Omit<Category, 'id'> | Category) => {
    clearMessages();
    setIsLoading(true); // Indicate loading during save
    try {
      if ('id' in categoryData && categoryData.id) { 
        const updatedCategory = await productService.updateCategoryAdmin(categoryData as Category);
        if (updatedCategory) {
          // setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c)); // Handled by loadCategories
          setSuccessMessage(t('common.success') + ": " + t('common.category') + " " + t('common.edit', {count: 1}).toLowerCase() + "!");
        } else {
          throw new Error(t('errors.apiErrorGeneric', { message: "Update operation returned undefined."}));
        }
      } else { 
        await productService.addCategoryAdmin(categoryData as Omit<Category, 'id'>);
        setSuccessMessage(t('common.success') + ": " + t('common.category') + " " + t('common.add', {count: 1}).toLowerCase() + "!");
      }
      await loadCategories(); // Reload all categories
      handleCloseModal();
    } catch (err) {
      console.error("Error saving category:", err);
      setActionError(`${t('errors.failedToLoadData', { entity: t('common.category').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    clearMessages();
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (window.confirm(t('common.confirm') + ` ${t('common.delete').toLowerCase()} "${categoryToDelete?.name || 'category'}"? ${t('common.cannotBeUndone')}`)) {
      setIsLoading(true);
      try {
        const result = await productService.deleteCategoryAdmin(categoryId);
        if (result.success) {
          setSuccessMessage(result.message || t('common.success') + ": " + t('common.category') + " " + t('common.delete', {count: 1}).toLowerCase() + "!");
          await loadCategories(); // Reload
        } else {
          setActionError(result.message || t('errors.failedToLoadData', { entity: t('common.category').toLowerCase() }));
        }
      } catch (err) {
        console.error("Error deleting category:", err);
        setActionError(`${t('errors.failedToLoadData', { entity: t('common.category').toLowerCase() })}: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
          setIsLoading(false);
      }
    }
  };

  const MessageDisplay = () => {
    if (actionError) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4">{actionError}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  };

  if (isLoading && categories.length === 0) {
    return <p className="text-center text-gray-500 py-8">{t('common.loading')} {t('common.category', { count: 2 }).toLowerCase()}...</p>;
  }


  return (
    <div className="space-y-6">
      <MessageDisplay />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">{t('adminPage.tabCategories')}</h2>
        <Button onClick={handleOpenAddModal} variant="primary" leftIcon={<PlusIcon />} disabled={isLoading}>
          {t('common.addNew')} {t('common.category').toLowerCase()}
        </Button>
      </div>
      
      {isLoading && categories.length > 0 && <p className="text-center text-gray-500 py-4">{t('common.loading')} {t('common.category', { count: 2 }).toLowerCase()}...</p>}

      <CategoryTable
        categories={categories}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteCategory}
      />

      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCategory}
          category={editingCategory}
          key={editingCategory ? editingCategory.id : 'new-category-modal'}
        />
      )}
    </div>
  );
};
