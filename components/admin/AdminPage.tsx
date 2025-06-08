
import React, { useState } from 'react';
import { ProductManagementPage } from './ProductManagementPage';
import { CategoryManagementPage } from './CategoryManagementPage';
import { ManufacturerManagementPage } from './ManufacturerManagementPage';
import { InventoryOverviewPage } from './InventoryOverviewPage';
import { SalesAnalyticsPage } from './SalesAnalyticsPage';
import { SalesHistoryPage } from './SalesHistoryPage';
import { UserManagementPage } from './UserManagementPage';
// import { DataManagementPage } from './DataManagementPage'; // Removed import
import { Button } from '../common/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { User } from '../../types';

interface AdminPageProps {
  currentUser: User;
}

type AdminTab = 'products' | 'categories' | 'manufacturers' | 'inventory' | 'salesHistory' | 'analytics' | 'userManagement'; // Removed 'dataManagement'

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const renderTabButton = (tabName: AdminTab, labelKey: string, isVisible: boolean = true) => {
    if (!isVisible) return null;
    return (
      <Button
        variant="ghost"
        onClick={() => setActiveTab(tabName)}
        className={`whitespace-nowrap py-3 px-1 md:px-3 border-b-2 font-medium text-sm ${
          activeTab === tabName
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
        aria-current={activeTab === tabName ? 'page' : undefined}
      >
        {t(labelKey)}
      </Button>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-4 md:space-x-6" aria-label="Tabs">
          {renderTabButton('products', 'adminPage.tabProducts')}
          {renderTabButton('categories', 'adminPage.tabCategories')}
          {renderTabButton('manufacturers', 'adminPage.tabManufacturers')}
          {renderTabButton('inventory', 'adminPage.tabInventory')}
          {renderTabButton('salesHistory', 'adminPage.tabSalesHistory')}
          {renderTabButton('analytics', 'adminPage.tabAnalytics')}
          {renderTabButton('userManagement', 'adminPage.tabUserManagement', currentUser.role === 'admin')}
          {/* {renderTabButton('dataManagement', 'adminPage.tabDataManagement', currentUser.role === 'admin')} */}
        </nav>
      </div>

      {activeTab === 'products' && <ProductManagementPage />}
      {activeTab === 'categories' && <CategoryManagementPage />}
      {activeTab === 'manufacturers' && <ManufacturerManagementPage />}
      {activeTab === 'inventory' && <InventoryOverviewPage />}
      {activeTab === 'salesHistory' && <SalesHistoryPage />}
      {activeTab === 'analytics' && <SalesAnalyticsPage />}
      {activeTab === 'userManagement' && currentUser.role === 'admin' && <UserManagementPage currentUser={currentUser} />}
      {/* {activeTab === 'dataManagement' && currentUser.role === 'admin' && <DataManagementPage />} */}
    </div>
  );
};
