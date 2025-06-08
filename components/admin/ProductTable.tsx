
import React from 'react';
import { Product } from '../../types';
import { Button } from '../common/Button';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { EyeIcon, EyeSlashIcon } from '../icons/VisibilityIcons';
import { DuplicateIcon } from '../icons/DuplicateIcon';

interface ProductTableProps {
  products: Product[];
  selectedProductIds: string[];
  onSelectProduct: (productId: string, isSelected: boolean) => void;
  onSelectAllProducts: (isSelected: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleVisibility: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProductIds,
  onSelectProduct,
  onSelectAllProducts,
  onEdit,
  onDelete,
  onToggleVisibility,
  onDuplicate,
}) => {
  const allSelected = products.length > 0 && products.every(p => selectedProductIds.includes(p.id));
  const someSelected = selectedProductIds.length > 0 && !allSelected;

  if (products.length === 0) {
    return <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">No products found.</p>;
  }

  return (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300" aria-label="Products">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    checked={allSelected}
                    ref={input => { // Indeterminate state for "some selected"
                        if (input) {
                            input.indeterminate = someSelected;
                        }
                    }}
                    onChange={(e) => onSelectAllProducts(e.target.checked)}
                    aria-label="Select all products"
                  />
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Image</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Code</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Category</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Manufacturer</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Price</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Total Stock</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-gray-900">Visible</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-gray-900 min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors duration-150 ${selectedProductIds.includes(product.id) ? 'bg-indigo-50' : ''}`}>
                  <td className="relative px-7 sm:w-12 sm:px-6">
                    {selectedProductIds.includes(product.id) && (
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                    )}
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      value={product.id}
                      checked={selectedProductIds.includes(product.id)}
                      onChange={(e) => onSelectProduct(product.id, e.target.checked)}
                      aria-label={`Select product ${product.title}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <img src={product.image} alt={product.title} className="w-10 h-10 object-cover rounded" 
                         onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=No+Img')}/>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 font-medium">{product.title}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.code}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.categoryName || product.categoryId}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.manufacturerName || product.manufacturerId}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">€{product.price.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.totalStock ?? 0}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleVisibility(product)}
                        aria-label={product.isVisible ? "Mark as not visible" : "Mark as visible"}
                        title={product.isVisible ? "Visible (Click to hide)" : "Hidden (Click to show)"}
                        className="flex items-center justify-center mx-auto"
                    >
                        {product.isVisible ? <EyeIcon className="text-green-500 h-5 w-5" /> : <EyeSlashIcon className="text-gray-400 h-5 w-5" />}
                    </Button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(product)} aria-label="Edit product" className="group inline-flex items-center">
                      <PencilIcon className="text-indigo-600 group-hover:text-indigo-800 h-5 w-5" />
                      <span className="ml-1 text-xs text-indigo-600 group-hover:text-indigo-800">Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDuplicate(product)} aria-label="Duplicate product" className="group inline-flex items-center">
                      <DuplicateIcon className="text-blue-500 group-hover:text-blue-700 h-5 w-5" />
                      <span className="ml-1 text-xs text-blue-500 group-hover:text-blue-700">Duplicate</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)} aria-label="Delete product" className="group inline-flex items-center">
                      <TrashIcon className="text-red-500 group-hover:text-red-700 h-5 w-5" />
                      <span className="ml-1 text-xs text-red-500 group-hover:text-red-700">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};